package main

import (
	"fmt"
	"math"
	"strconv"
	"strings"
)

func Sqrt(x float64) float64 {
	var squareRoot = math.Round(x / 2)
	for {

		if squareRoot < 0 {
			return -1
		}
		if squareRoot*squareRoot == x {
			return squareRoot
		}
		squareRoot -= 1
	}

}

type Literal struct {
	kind  string
	value interface{}
	raw   string
}

type VariableDeclarator struct {
	identifier     string
	typeAnnotation string
	value          Literal
}
type VariableDeclaration struct {
	kind       string
	declarator VariableDeclarator
}

type AST struct {
	body struct {
		declarations []VariableDeclaration
	}
}

func parseValue(v string) (interface{}, string) {

	trimmed := strings.Trim(v, " ")

	if valInt, err := strconv.Atoi(trimmed); err == nil {
		return valInt, "NumericLiteral"
	}

	return trimmed, "StringLiteral"

}

func Map[T, U any](ts []T, f func(T) U) []U {
	us := make([]U, len(ts))
	for i := range ts {
		us[i] = f(ts[i])
	}
	return us
}

func ParseToAST(code string) (AST, error) {

	declarationsStrings := strings.Split(code, ";")

	var declarations = []VariableDeclaration{}

	for _, decl := range declarationsStrings {
		variableDeclaration, err := parseVariableDeclaration(decl)

		declarations = append(declarations, variableDeclaration)
		if err != nil {
			return AST{}, err
		}
	}

	// var declarations = []VariableDeclaration{variableDeclaration}

	var ast = AST{
		body: struct{ declarations []VariableDeclaration }{declarations: declarations},
	}

	return ast, nil

}

func parseVariableDeclarator(code string) (VariableDeclarator, error) {
	_left, right, found := strings.Cut(code, "=")

	if !found {
		return VariableDeclarator{}, fmt.Errorf("[VariableDeclarator] Could not find '=' in %s", code)
	}

	value, kind := parseValue(right)
	left := strings.ReplaceAll(_left, " ", "")

	identifier, typeAnnotation, _ := strings.Cut(left, ":")

	return VariableDeclarator{
		identifier:     identifier,
		typeAnnotation: typeAnnotation,
		value: Literal{
			kind:  kind,
			value: value,
			raw:   right,
		},
	}, nil

}
func parseVariableDeclaration(_code string) (VariableDeclaration, error) {

	code := strings.TrimSpace(_code)

	declarationKind, variableDeclaratorStr, found := strings.Cut(code, " ")

	if !found {
		return VariableDeclaration{}, fmt.Errorf("[VariableDeclaration] Could not find ' ' in %s", code)
	}

	variableDeclarator, err := parseVariableDeclarator(variableDeclaratorStr)

	if err != nil {
		return VariableDeclaration{}, err
	}

	return VariableDeclaration{
		kind:       declarationKind,
		declarator: variableDeclarator,
	}, nil

}

func main() {
	d, err := parseVariableDeclaration("const foo : string = 'hello world'")

	if err != nil {
		fmt.Print(err)
	}
	fmt.Print(d)
}
