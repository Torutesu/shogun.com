package handlers

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"unicode/utf8"
)

const basePath = "/home/user"

// safePath validates and resolves the given path, ensuring it stays under /home/user.
// Returns the cleaned absolute path or an error.
func safePath(raw string) (string, error) {
	if raw == "" {
		return "", fmt.Errorf("path is required")
	}

	// Resolve to absolute
	cleaned := filepath.Clean(raw)
	if !filepath.IsAbs(cleaned) {
		cleaned = filepath.Join(basePath, cleaned)
	}

	// Ensure the resolved path is under basePath
	if !strings.HasPrefix(cleaned, basePath) {
		return "", fmt.Errorf("path must be under %s", basePath)
	}

	return cleaned, nil
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

// FileEntry represents a single file/directory in a listing.
type FileEntry struct {
	Name     string `json:"name"`
	Type     string `json:"type"` // "file" or "directory"
	Size     int64  `json:"size"`
	Modified int64  `json:"modified"` // Unix timestamp
}

// ListHandler handles GET /files/list?path=
func ListHandler(tracker *ActivityTracker) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tracker.Touch()

		dirPath := r.URL.Query().Get("path")
		if dirPath == "" {
			dirPath = basePath
		}

		resolved, err := safePath(dirPath)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		entries, err := os.ReadDir(resolved)
		if err != nil {
			if os.IsNotExist(err) {
				writeError(w, http.StatusNotFound, "directory not found")
			} else {
				writeError(w, http.StatusInternalServerError, err.Error())
			}
			return
		}

		result := make([]FileEntry, 0, len(entries))
		for _, entry := range entries {
			info, err := entry.Info()
			if err != nil {
				continue
			}
			entryType := "file"
			if entry.IsDir() {
				entryType = "directory"
			}
			result = append(result, FileEntry{
				Name:     entry.Name(),
				Type:     entryType,
				Size:     info.Size(),
				Modified: info.ModTime().Unix(),
			})
		}

		writeJSON(w, http.StatusOK, result)
	}
}

// ReadHandler handles GET /files/read?path=
func ReadHandler(tracker *ActivityTracker) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tracker.Touch()

		filePath := r.URL.Query().Get("path")
		resolved, err := safePath(filePath)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		info, err := os.Stat(resolved)
		if err != nil {
			if os.IsNotExist(err) {
				writeError(w, http.StatusNotFound, "file not found")
			} else {
				writeError(w, http.StatusInternalServerError, err.Error())
			}
			return
		}

		if info.IsDir() {
			writeError(w, http.StatusBadRequest, "path is a directory, not a file")
			return
		}

		// Limit file size to 10MB for read operations
		const maxReadSize = 10 * 1024 * 1024
		if info.Size() > maxReadSize {
			writeError(w, http.StatusBadRequest, "file too large (max 10MB)")
			return
		}

		data, err := os.ReadFile(resolved)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		// Return as text if valid UTF-8, otherwise base64
		if utf8.Valid(data) {
			writeJSON(w, http.StatusOK, map[string]interface{}{
				"content":  string(data),
				"encoding": "utf-8",
				"size":     info.Size(),
			})
		} else {
			writeJSON(w, http.StatusOK, map[string]interface{}{
				"content":  base64.StdEncoding.EncodeToString(data),
				"encoding": "base64",
				"size":     info.Size(),
			})
		}
	}
}

// WriteRequest is the JSON body for write operations.
type WriteRequest struct {
	Path    string `json:"path"`
	Content string `json:"content"`
}

// WriteHandler handles POST /files/write
func WriteHandler(tracker *ActivityTracker) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tracker.Touch()

		var req WriteRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON body")
			return
		}

		resolved, err := safePath(req.Path)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		// Ensure parent directory exists
		dir := filepath.Dir(resolved)
		if err := os.MkdirAll(dir, 0755); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to create parent directory: "+err.Error())
			return
		}

		if err := os.WriteFile(resolved, []byte(req.Content), 0644); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to write file: "+err.Error())
			return
		}

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"ok":   true,
			"path": resolved,
		})
	}
}

// MkdirRequest is the JSON body for mkdir operations.
type MkdirRequest struct {
	Path string `json:"path"`
}

// MkdirHandler handles POST /files/mkdir
func MkdirHandler(tracker *ActivityTracker) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tracker.Touch()

		var req MkdirRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON body")
			return
		}

		resolved, err := safePath(req.Path)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		if err := os.MkdirAll(resolved, 0755); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to create directory: "+err.Error())
			return
		}

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"ok":   true,
			"path": resolved,
		})
	}
}

// DeleteHandler handles DELETE /files?path=
func DeleteHandler(tracker *ActivityTracker) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tracker.Touch()

		filePath := r.URL.Query().Get("path")
		resolved, err := safePath(filePath)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		// Prevent deleting the base path itself
		if resolved == basePath {
			writeError(w, http.StatusForbidden, "cannot delete home directory")
			return
		}

		if err := os.RemoveAll(resolved); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to delete: "+err.Error())
			return
		}

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"ok":   true,
			"path": resolved,
		})
	}
}

// UploadRequest is the JSON body for upload operations (base64-encoded).
type UploadRequest struct {
	Path          string `json:"path"`
	ContentBase64 string `json:"content_base64"`
	Filename      string `json:"filename"`
}

// UploadHandler handles POST /files/upload
func UploadHandler(tracker *ActivityTracker) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tracker.Touch()

		// Support both JSON (base64) and multipart form upload
		contentType := r.Header.Get("Content-Type")

		if strings.HasPrefix(contentType, "multipart/form-data") {
			handleMultipartUpload(w, r)
			return
		}

		// JSON upload with base64 content
		var req UploadRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON body")
			return
		}

		resolved, err := safePath(req.Path)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		data, err := base64.StdEncoding.DecodeString(req.ContentBase64)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid base64 content")
			return
		}

		dir := filepath.Dir(resolved)
		if err := os.MkdirAll(dir, 0755); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to create parent directory: "+err.Error())
			return
		}

		if err := os.WriteFile(resolved, data, 0644); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to write file: "+err.Error())
			return
		}

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"ok":   true,
			"path": resolved,
			"size": len(data),
		})
	}
}

func handleMultipartUpload(w http.ResponseWriter, r *http.Request) {
	// Limit upload to 100MB
	r.Body = http.MaxBytesReader(w, r.Body, 100*1024*1024)

	if err := r.ParseMultipartForm(32 * 1024 * 1024); err != nil {
		writeError(w, http.StatusBadRequest, "failed to parse multipart form: "+err.Error())
		return
	}

	destPath := r.FormValue("path")
	resolved, err := safePath(destPath)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, "file field is required")
		return
	}
	defer file.Close()

	dir := filepath.Dir(resolved)
	if err := os.MkdirAll(dir, 0755); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create parent directory: "+err.Error())
		return
	}

	dst, err := os.Create(resolved)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create file: "+err.Error())
		return
	}
	defer dst.Close()

	n, err := io.Copy(dst, file)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to write file: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"ok":   true,
		"path": resolved,
		"size": n,
	})
}

// DownloadHandler handles GET /files/download?path=
func DownloadHandler(tracker *ActivityTracker) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tracker.Touch()

		filePath := r.URL.Query().Get("path")
		resolved, err := safePath(filePath)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		info, err := os.Stat(resolved)
		if err != nil {
			if os.IsNotExist(err) {
				writeError(w, http.StatusNotFound, "file not found")
			} else {
				writeError(w, http.StatusInternalServerError, err.Error())
			}
			return
		}

		if info.IsDir() {
			writeError(w, http.StatusBadRequest, "path is a directory, not a file")
			return
		}

		filename := filepath.Base(resolved)

		// Detect content type
		ext := filepath.Ext(filename)
		ct := mime.TypeByExtension(ext)
		if ct == "" {
			ct = "application/octet-stream"
		}

		w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
		w.Header().Set("Content-Type", ct)
		http.ServeFile(w, r, resolved)
	}
}
