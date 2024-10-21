package main

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func Test_ASTParser(t *testing.T) {
	t.Run("it parses a number const declaration", func(t *testing.T) {
		constVariableDeclaration := "const a = 1"

		ast, err := ParseToAST(constVariableDeclaration)

		if err != nil {
			t.Fail()
		}
		declaration := ast.body.declarations[0]

		isCorrect := declaration.kind == "const" &&
			declaration.declarator.identifier == "a" &&
			declaration.declarator.value.value == 1 &&
			declaration.declarator.value.kind == "NumericLiteral"

		if !isCorrect {
			t.Fail()
		}

	})

	t.Run("it parses a let declaration", func(t *testing.T) {
		constVariableDeclaration := "let b = 2"

		ast, err := ParseToAST(constVariableDeclaration)
		declaration := ast.body.declarations[0]

		assert.Nil(t, err)

		isCorrect := declaration.kind == "let" &&
			declaration.declarator.identifier == "b" &&
			declaration.declarator.value.value == 2 &&
			declaration.declarator.value.kind == "NumericLiteral"

		if !isCorrect {
			t.Fail()
		}

	})

	t.Run("it parses a var string declaration", func(t *testing.T) {

		ast, err := ParseToAST("var foo = 'hello'")

		declaration := ast.body.declarations[0]

		assert.Nil(t, err)
		assert.Equal(t, "var", declaration.kind)
		assert.Equal(t, "'hello'", declaration.declarator.value.value)
		assert.Equal(t, "StringLiteral", declaration.declarator.value.kind)

	})

	t.Run("it parses a primitive typed declaration", func(t *testing.T) {
		ast, err := ParseToAST("const foo : string = 'hello world'")
		declaration := ast.body.declarations[0]

		assert.Nil(t, err)
		assert.Equal(t, "'hello world'", declaration.declarator.value.value)
		assert.Equal(t, "string", declaration.declarator.typeAnnotation)
	})

	t.Run("it parses multiple expressions", func(t *testing.T) {
		ast, err := ParseToAST(`
		  const foo : string = 'hello there';
		  var bar:number=45.123
		`)

		assert.Nil(t, err)

		assert.Len(t, ast.body.declarations, 2)
		// firstDeclaration := ast.body.declarations[0]
		secondDeclaration := ast.body.declarations[1]

		assert.EqualValues(t, "bar", secondDeclaration.declarator.identifier)

	})
}
