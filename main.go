// main.go
package main

import (
	"bytes"
	"compress/gzip"
	"embed"
	"io"
	"io/fs"
	"log"
	"net/http"
	"path"
	"strings"
)

//go:embed all:dist
var distFS embed.FS

func main() {
	// ชี้ FS ไปที่โฟลเดอร์ dist โดยตรง
	staticFS, err := fs.Sub(distFS, "dist")
	if err != nil {
		log.Fatalf("cannot sub FS to dist: %v", err)
	}

	mux := http.NewServeMux()
	mux.Handle("/", spaHandler(staticFS))

	handler := gzipMiddleware(securityHeaders(mux))

	addr := ":8080"
	log.Printf("Serving on %s", addr)
	log.Fatal(http.ListenAndServe(addr, handler))
}

// แก้ไข spaHandler ให้เสิร์ฟไฟล์ asset ตรงๆ และ fallback index.html สำหรับ SPA
func spaHandler(staticFS fs.FS) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		clean := path.Clean(r.URL.Path)
		log.Printf("spaHandler: requested path: %s", clean)

		// ถ้า path เป็น root หรือ /index.html ให้เสิร์ฟ index.html
		if clean == "/" || clean == "/index.html" {
			w.Header().Set("Cache-Control", "no-store")
			f, err := staticFS.Open("index.html")
			if err != nil {
				http.Error(w, "index.html not found", http.StatusNotFound)
				return
			}
			defer f.Close()
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			io.Copy(w, f)
			return
		}

		// ถ้าเป็น asset (.js, .css, .png, ฯลฯ) ให้เสิร์ฟไฟล์นั้น
		fsPath := strings.TrimPrefix(clean, "/")
		if isAsset(clean) {
			f, err := staticFS.Open(fsPath)
			if err == nil {
				defer f.Close()
				info, err := fs.Stat(staticFS, fsPath)
				if err == nil {
					// อ่านไฟล์ทั้งหมดลง memory เพื่อใช้ ServeContent
					data, err := io.ReadAll(f)
					if err == nil {
						w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
						http.ServeContent(w, r, fsPath, info.ModTime(), bytes.NewReader(data))
						return
					}
				}
				// ถ้าเกิด error ใด ๆ fallback เป็น io.Copy
				w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
				io.Copy(w, f)
				return
			}
		}

		// fallback: เสิร์ฟ index.html (SPA)
		w.Header().Set("Cache-Control", "no-store")
		f, err := staticFS.Open("index.html")
		if err != nil {
			http.Error(w, "index.html not found", http.StatusNotFound)
			return
		}
		defer f.Close()
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		io.Copy(w, f)
	})
}

func isAsset(p string) bool {
	return strings.Contains(path.Base(p), ".")
}

func gzipMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// ถ้า client ไม่รองรับ gzip หรือ header ถูกเขียนไปแล้ว ให้ข้าม
		if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
			next.ServeHTTP(w, r)
			return
		}
		// ใช้ ResponseWriter ที่เช็คว่า header ถูกเขียนไปแล้วหรือยัง
		gzw := gzip.NewWriter(w)
		defer gzw.Close()

		w.Header().Set("Content-Encoding", "gzip")
		w.Header().Add("Vary", "Accept-Encoding")
		gzr := &gzipResponseWriter{ResponseWriter: w, Writer: gzw}
		next.ServeHTTP(gzr, r)
	})
}

type gzipResponseWriter struct {
	http.ResponseWriter
	io.Writer
}

func (w *gzipResponseWriter) Write(b []byte) (int, error) {
	w.Header().Del("Content-Length")
	return w.Writer.Write(b)
}

func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
		next.ServeHTTP(w, r)
	})
}
