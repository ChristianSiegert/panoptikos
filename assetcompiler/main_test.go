package main

import (
	"bytes"
	"io/ioutil"
	"os"
	"testing"
)

func TestUpdateAppYaml(t *testing.T) {
	removeFile := func(fileName string) {
		if err := os.Remove(fileName); err != nil {
			t.Errorf("Couldn’t remove temporary file: %s", err)
		}
	}

	token := "bar"

	tempFileContent := []byte(`
		handlers:
		- url: /.*
		  static_files: webroot/compiled-index/index-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.html
		  upload: webroot/compiled-index/index-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ\.html
 	`)

	expectedResult := []byte(`
		handlers:
		- url: /.*
		  static_files: webroot/compiled-index/index-bar.html
		  upload: webroot/compiled-index/index-bar\.html
 	`)

	tempFile, err := ioutil.TempFile("", "panoptikos_")

	if err != nil {
		t.Errorf("Couldn’t create temporary file: %s", err)
		return
	}

	if _, err := tempFile.Write(tempFileContent); err != nil {
		t.Errorf("Couldn’t write to temporary file: %s", err)
		removeFile(tempFile.Name())
		return
	}

	if err := updateAppYaml(tempFile.Name(), token); err != nil {
		t.Errorf("Couldn’t update app.yaml: %s", err)
		removeFile(tempFile.Name())
		return
	}

	if fileContent, err := ioutil.ReadFile(tempFile.Name()); err != nil {
		t.Errorf("Couldn’t read app.yaml: %s", err)
	} else if !bytes.Equal(fileContent, expectedResult) {
		t.Errorf("app.yaml wasn’t updated correctly. Got: %s", fileContent)
	}

	removeFile(tempFile.Name())
}
