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
)

const basePath = "/home/user"

// safePath validates and resolves a path, ensuring it stays under basePath.
// Returns the cleaned absolute path or an error.
func safePath(raw string) (string, error) {
	if raw == "" {
		return "", fmt.Errorf("path is required")
	}

	cleaned := filepath.Clean(raw)
	if !filepath.IsAbs(cleaned) {
		cleaned = filepath.Join(basePath, cleaned)
	}

	// Resolve symlinks on the parent to prevent traversal via symlink.
	parent := filepath.Dir(cleaned)
	resolved, err := filepath.EvalSymlinks(parent)
	if err != nil {
		// Parent may not exist yet (e.g., mkdir -p). Fall back to lexical check.
		if !strings.HasPrefix(cleaned, basePath) {
			return "", fmt.Errorf("path must be under %s", basePath)
		}
		return cleaned, nil
	}

	full := filepath.Join(resolved, filepath.Base(cleaned))
	if !strings.HasPrefix(full, basePath) {
		return "", fmt.Errorf("path must be under %s", basePath)
	}
	return full, nil
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

// FileEntry represents a single directory entry in list responses.
type FileEntry struct {
	Name     string `json:"name"`
	Type     string `json:"type"` // "file" or "directory"
	Size     int64  `json:"size"`
	Modified string `json:"modified"`
}

// ListHandler handles GET /files/list?path=
func ListHandler(activity *Activity) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		activity.Touch()

		dirPath := r.URL.Query().Get("path")
		if dirPath == "" {
			dirPath = basePath
		}

		safe, err := safePath(dirPath)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		entries, err := os.ReadDir(safe)
		if err != nil {
			if os.IsNotExist(err) {
				writeError(w, http.StatusNotFound, "directory not found")
			} else {
				writeError(w, http.StatusInternalServerError, err.Error())
			}
			return
		}

		result := make([]FileEntry, 0, len(entries))
		for _, e := range entries {
			info, err := e.Info()
			if err != nil {
				continue
			}
			entryType := "file"
			if e.IsDir() {
				entryType = "directory"
			}
			result = append(result, FileEntry{
				Name:     e.Name(),
				Type:     entryType,
				Size:     info.Size(),
				Modified: info.ModTime().UTC().Format("2006-01-02T15:04:05Z"),
			})
		}

		writeJSON(w, http.StatusOK, result)
	}
}

// ReadHandler handles GET /files/read?path=
func ReadHandler(activity *Activity) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		activity.Touch()

		filePath := r.URL.Query().Get("path")
		if filePath == "" {
			writeError(w, http.StatusBadRequest, "path is required")
			return
		}

		safe, err := safePath(filePath)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		info, err := os.Stat(safe)
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

		// Limit to 10MB for read.
		const maxSize = 10 * 1024 * 1024
		if info.Size() > maxSize {
			writeError(w, http.StatusBadRequest, "file too large (max 10MB)")
			return
		}

		data, err := os.ReadFile(safe)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		// Detect binary by checking for null bytes in the first 8KB.
		isBinary := false
		check := data
		if len(check) > 8192 {
			check = check[:8192]
		}
		for _, b := range check {
			if b == 0 {
				isBinary = true
				break
			}
		}

		if isBinary {
			writeJSON(w, http.StatusOK, map[string]interface{}{
				"path":     safe,
				"encoding": "base64",
				"content":  base64.StdEncoding.EncodeToString(data),
				"size":     info.Size(),
			})
		} else {
			writeJSON(w, http.StatusOK, map[string]interface{}{
				"path":     safe,
				"encoding": "utf-8",
				"content":  string(data),
				"size":     info.Size(),
			})
		}
	}
}

// WriteHandler handles POST /files/write with JSON body { path, content }.
func WriteHandler(activity *Activity) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		activity.Touch()

		var req struct {
			Path    string `json:"path"`
			Content string `json:"content"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON body")
			return
		}

		safe, err := safePath(req.Path)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		// Ensure parent directory exists.
		if err := os.MkdirAll(filepath.Dir(safe), 0755); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		if err := os.WriteFile(safe, []byte(req.Content), 0644); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"path":    safe,
			"size":    len(req.Content),
			"written": true,
		})
	}
}

// MkdirHandler handles POST /files/mkdir with JSON body { path }.
func MkdirHandler(activity *Activity) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		activity.Touch()

		var req struct {
			Path string `json:"path"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON body")
			return
		}

		safe, err := safePath(req.Path)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		if err := os.MkdirAll(safe, 0755); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"path":    safe,
			"created": true,
		})
	}
}

// DeleteHandler handles DELETE /files?path=
func DeleteHandler(activity *Activity) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		activity.Touch()

		filePath := r.URL.Query().Get("path")
		if filePath == "" {
			writeError(w, http.StatusBadRequest, "path is required")
			return
		}

		safe, err := safePath(filePath)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		// Prevent deleting the base path itself.
		if safe == basePath {
			writeError(w, http.StatusForbidden, "cannot delete base directory")
			return
		}

		if err := os.RemoveAll(safe); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"path":    safe,
			"deleted": true,
		})
	}
}

// UploadHandler handles POST /files/upload with JSON body
// { path, content_base64, filename }.
func UploadHandler(activity *Activity) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		activity.Touch()

		var req struct {
			Path          string `json:"path"`
			ContentBase64 string `json:"content_base64"`
			Filename      string `json:"filename"`
		}
		if err := json.NewDecoder(io.LimitReader(r.Body, 100*1024*1024)).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON body")
			return
		}

		safe, err := safePath(req.Path)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		data, err := base64.StdEncoding.DecodeString(req.ContentBase64)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid base64 content")
			return
		}

		if err := os.MkdirAll(filepath.Dir(safe), 0755); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		if err := os.WriteFile(safe, data, 0644); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"path":     safe,
			"size":     len(data),
			"filename": req.Filename,
			"uploaded": true,
		})
	}
}

// DownloadHandler handles GET /files/download?path=
func DownloadHandler(activity *Activity) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		activity.Touch()

		filePath := r.URL.Query().Get("path")
		if filePath == "" {
			writeError(w, http.StatusBadRequest, "path is required")
			return
		}

		safe, err := safePath(filePath)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		info, err := os.Stat(safe)
		if err != nil {
			if os.IsNotExist(err) {
				writeError(w, http.StatusNotFound, "file not found")
			} else {
				writeError(w, http.StatusInternalServerError, err.Error())
			}
			return
		}
		if info.IsDir() {
			writeError(w, http.StatusBadRequest, "path is a directory")
			return
		}

		filename := filepath.Base(safe)
		contentType := mime.TypeByExtension(filepath.Ext(safe))
		if contentType == "" {
			contentType = "application/octet-stream"
		}

		w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
		w.Header().Set("Content-Type", contentType)
		http.ServeFile(w, r, safe)
	}
}
