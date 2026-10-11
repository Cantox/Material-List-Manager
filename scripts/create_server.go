package main

import (
	"fmt"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

func openBrowser(url string) {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	case "darwin":
		cmd = exec.Command("open", url)
	default:
		cmd = exec.Command("xdg-open", url)
	}
	cmd.Start()
}

func main() {
	// Serve la cartella in cui si trova l'eseguibile
	exe, _ := os.Executable()
	dir := filepath.Dir(exe)
	os.Chdir(dir)

	// Porta libera scelta automaticamente
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		fmt.Println("Errore:", err)
		fmt.Scanln()
		return
	}
	port := ln.Addr().(*net.TCPAddr).Port
	url := fmt.Sprintf("http://127.0.0.1:%d/index.html", port)

	fs := http.FileServer(http.Dir(dir))
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-cache")
		fs.ServeHTTP(w, r)
	})

	fmt.Println("Server attivo su", url)
	fmt.Println("Chiudi questa finestra per fermarlo.")
	openBrowser(url)
	http.Serve(ln, handler)
}