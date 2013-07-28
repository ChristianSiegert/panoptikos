package sanitizer

import "testing"

var html = `
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="initial-scale=1, width=device-width">
		<title>Panoptikos</title>

		{{if .IsDevAppServer}}
			{{range .DevCssFiles}}
				<link href="{{.}}" rel="stylesheet" type="text/css">
			{{end}}
		{{else}}
			<link href="/{{.CompiledCssFile}}" rel="stylesheet" type="text/css">
		{{end}}
	</head>

	<body>
		<p id="some-class">Foo</p>
		<p id="some-other-class">Bar</p>

		{{if .IsDevAppServer}}
			{{range .DevJsFiles}}
				<script src="{{.}}"></script>
			{{end}}
		{{else}}
			<script src="/{{.CompiledJsFile}}"></script>
		{{end}}

		<!-- Comment 1 -->
		<script>var s = "Some JavaScript code"</script>

		<!-- Comment 2 -->
		<noscript>
			<div>Enable JavaScript.</div>
		</noscript>
	</body>
</html>
`

func TestRemoveWhitespace(t *testing.T) {
	expectedResult := `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="initial-scale=1, width=device-width"><title>Panoptikos</title>{{if .IsDevAppServer}}{{range .DevCssFiles}}<link href="{{.}}" rel="stylesheet" type="text/css">{{end}}{{else}}<link href="/{{.CompiledCssFile}}" rel="stylesheet" type="text/css">{{end}}</head><body><p id="some-class">Foo</p><p id="some-other-class">Bar</p>{{if .IsDevAppServer}}{{range .DevJsFiles}}<script src="{{.}}"></script>{{end}}{{else}}<script src="/{{.CompiledJsFile}}"></script>{{end}}<!-- Comment 1 --><script>var s = "Some JavaScript code"</script><!-- Comment 2 --><noscript><div>Enable JavaScript.</div></noscript></body></html>`

	if result := RemoveWhitespace(html); result != expectedResult {
		t.Errorf("Whitespace wasn't removed correctly: '%s'", result)
	}
}

func BenchmarkRemoveWhitespace(b *testing.B) {
	for i := 0; i < b.N; i++ {
		RemoveWhitespace(html)
	}
}
