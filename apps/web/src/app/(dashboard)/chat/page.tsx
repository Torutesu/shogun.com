"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@shogun/ui";
import type { AIModel, ChatMessage, StreamEvent } from "@shogun/shared/types";
import { api } from "@/lib/api";
import { Header } from "@/components/layout/header";
import { ConversationList } from "@/components/chat/conversation-list";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatInput } from "@/components/chat/chat-input";
import { Spinner } from "@/components/ui/loading";

interface Conversation {
  id: string;
  title: string;
  pinned: boolean;
  lastMessageAt: string;
  preview?: string;
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [model, setModel] = useState<AIModel>("claude-sonnet-4-20250514");
  const [streaming, setStreaming] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [mobileShowList, setMobileShowList] = useState(true);

  // Load conversations
  useEffect(() => {
    api.chat.listConversations().then((convs) => {
      setConversations(convs);
      setLoadingConvs(false);
    }).catch(() => setLoadingConvs(false));
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeId) return;
    setLoadingMsgs(true);
    api.chat.getConversation(activeId).then((conv) => {
      setMessages(conv.messages);
      setLoadingMsgs(false);
    }).catch(() => setLoadingMsgs(false));
  }, [activeId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewConversation = useCallback(async () => {
    try {
      const conv = await api.chat.createConversation();
      setConversations((prev) => [
        { ...conv, pinned: false, lastMessageAt: new Date().toISOString() },
        ...prev,
      ]);
      setActiveId(conv.id);
      setMessages([]);
      setMobileShowList(false);
    } catch {
      // ignore
    }
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveId(id);
    setMobileShowList(false);
  }, []);

  const handleSend = useCallback(async (content: string) => {
    if (!activeId || streaming) return;

    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversationId: activeId,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Create placeholder assistant message
    const assistantId = `temp-assistant-${Date.now()}`;
    const assistantMsg: ChatMessage = {
      id: assistantId,
      conversationId: activeId,
      role: "assistant",
      content: "",
      model,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, assistantMsg]);

    setStreaming(true);
    const abort = new AbortController();
    abortRef.current = abort;

    try {
      await api.chat.stream(
        activeId,
        content,
        model,
        (event: StreamEvent) => {
          if (event.type === "delta") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + event.content } : m,
              ),
            );
          } else if (event.type === "tool_call") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      toolCalls: [
                        ...(m.toolCalls ?? []),
                        { id: `tc-${Date.now()}`, name: event.name, input: event.input },
                      ],
                    }
                  : m,
              ),
            );
          } else if (event.type === "tool_result") {
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== assistantId) return m;
                const lastCall = m.toolCalls?.[m.toolCalls.length - 1];
                return {
                  ...m,
                  toolResults: [
                    ...(m.toolResults ?? []),
                    { toolCallId: lastCall?.id ?? "", output: event.output, isError: event.isError },
                  ],
                };
              }),
            );
          }
        },
        abort.signal,
      );
    } catch {
      // stream ended or aborted
    } finally {
      setStreaming(false);
      abortRef.current = null;
      // Update conversation list preview
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, lastMessageAt: new Date().toISOString(), preview: content.slice(0, 80) }
            : c,
        ),
      );
    }
  }, [activeId, streaming, model]);

  const handleRename = useCallback(async (id: string, title: string) => {
    try {
      await api.chat.renameConversation(id, title);
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
    } catch { /* ignore */ }
  }, []);

  const handlePin = useCallback(async (id: string, pinned: boolean) => {
    try {
      await api.chat.pinConversation(id, pinned);
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, pinned } : c)));
    } catch { /* ignore */ }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await api.chat.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
    } catch { /* ignore */ }
  }, [activeId]);

  return (
    <div className="flex h-full flex-col">
      <Header title="Chat" showModelSelector selectedModel={model} onModelChange={setModel} />

      <div className="flex flex-1 overflow-hidden">
        {/* Conversation sidebar */}
        <div className={cn(
          "w-72 flex-shrink-0",
          "max-md:absolute max-md:inset-y-14 max-md:left-0 max-md:z-20 max-md:w-full",
          !mobileShowList && "max-md:hidden",
        )}>
          {loadingConvs ? (
            <div className="flex h-full items-center justify-center bg-light-card dark:bg-dark-card border-r border-light-border dark:border-dark-border">
              <Spinner />
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              activeId={activeId ?? undefined}
              onSelect={handleSelectConversation}
              onNew={handleNewConversation}
              onRename={handleRename}
              onPin={handlePin}
              onDelete={handleDelete}
            />
          )}
        </div>

        {/* Messages */}
        <div className={cn("flex flex-1 flex-col", mobileShowList && "max-md:hidden")}>
          {/* Mobile back button */}
          <button
            onClick={() => setMobileShowList(true)}
            className="flex items-center gap-1 px-4 py-2 text-xs text-light-text-muted dark:text-dark-text-muted md:hidden cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Conversations
          </button>

          {!activeId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <p className="text-light-text-muted dark:text-dark-text-muted text-sm">
                Select a conversation or start a new one
              </p>
              <button
                onClick={handleNewConversation}
                className="inline-flex items-center gap-2 rounded-sm bg-gold px-4 py-2 text-sm font-medium text-dark transition-colors hover:bg-gold-dark cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New conversation
              </button>
            </div>
          ) : (
            <>
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto">
                {loadingMsgs ? (
                  <div className="flex h-full items-center justify-center">
                    <Spinner />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-light-text-dim dark:text-dark-text-dim">
                      Start the conversation...
                    </p>
                  </div>
                ) : (
                  <div className="py-4">
                    {messages.map((msg, i) => (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isStreaming={streaming && i === messages.length - 1 && msg.role === "assistant"}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input */}
              <ChatInput onSend={handleSend} model={model} onModelChange={setModel} disabled={streaming} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
