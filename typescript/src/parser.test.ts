import { describe, it, expect, beforeEach } from "vitest";
import { Parser, VariableDeclaration } from "./parser";

describe("AST Parser", () => {
  let parser!: Parser;

  beforeEach(() => {
    parser = new Parser();
  });

  describe("variable declarations", () => {
    it("parses a const declaration", () => {
      const ast = parser.parse("const foo = 1");

      expect(ast).toEqual({
        type: "VariableDeclaration",
        declarator: "const",
        variableName: "foo",
        value: {
          type: "NumericLiteral",
          value: 1,
        },
      });
    });

    it("parses a let declaration", () => {
      const ast = parser.parse("let bar = 3.1");

      expect(ast).toEqual({
        type: "VariableDeclaration",
        declarator: "let",
        variableName: "bar",
        value: {
          type: "NumericLiteral",
          value: 3.1,
        },
      });
    });

    it("parses a var declaration without whitespaces", () => {
      const ast = parser.parse("var baz=1");

      expect(ast).toEqual({
        type: "VariableDeclaration",
        declarator: "var",
        variableName: "baz",
        value: {
          type: "NumericLiteral",
          value: 1,
        },
      });
    });

    it("handles negative numbers", () => {
      const ast = parser.parse("var baz=-1");

      expect(ast).toEqual({
        type: "VariableDeclaration",
        declarator: "var",
        variableName: "baz",
        value: {
          type: "NumericLiteral",
          value: -1,
        },
      });
    });
  });

  describe("operations", () => {
    it("parses a sum operation", () => {
      const ast = parser.parse("const sum=2+3");

      expect(ast).toEqual({
        type: "VariableDeclaration",
        declarator: "const",
        variableName: "sum",
        value: {
          type: "SumOperation",
          left: { type: "NumericLiteral", value: 2 },
          right: { type: "NumericLiteral", value: 3 },
        },
      });
    });

    it("parses a substraction ", () => {
      const ast = parser.parse("const myVar =4-10");

      expect(ast).toEqual({
        type: "VariableDeclaration",
        declarator: "const",
        variableName: "myVar",
        value: {
          type: "SubOperation",
          left: { type: "NumericLiteral", value: 4 },
          right: { type: "NumericLiteral", value: 10 },
        },
      });
    });

    it("parses a multiplication", () => {
      const ast = parser.parse("const myVar =4*10");

      expect(ast).toEqual({
        type: "VariableDeclaration",
        declarator: "const",
        variableName: "myVar",
        value: {
          type: "MultiplicationOperation",
          left: { type: "NumericLiteral", value: 4 },
          right: { type: "NumericLiteral", value: 10 },
        },
      });
    });

    describe("nested operations", () => {
      it("parses nested sums", () => {
        const ast = parser.parse("const foo =1+2+3");

        expect(ast).toEqual({
          type: "VariableDeclaration",
          declarator: "const",
          variableName: "foo",
          value: {
            type: "SumOperation",
            left: {
              type: "NumericLiteral",
              value: 1,
            },
            right: {
              type: "SumOperation",
              left: {
                type: "NumericLiteral",
                value: 2,
              },
              right: {
                type: "NumericLiteral",
                value: 3,
              },
            },
          },
        });
      });

      it("parses nested sums and substractions", () => {
        const ast = parser.parse("const foo =1-2+3-4");

        expect(ast).toEqual<VariableDeclaration>({
          type: "VariableDeclaration",
          declarator: "const",
          variableName: "foo",
          value: {
            type: "SubOperation",
            left: {
              type: "NumericLiteral",
              value: 1,
            },
            right: {
              type: "SumOperation",
              left: {
                type: "NumericLiteral",
                value: 2,
              },
              right: {
                type: "SubOperation",
                left: {
                  type: "NumericLiteral",
                  value: 3,
                },
                right: {
                  type: "NumericLiteral",
                  value: 4,
                },
              },
            },
          },
        });
      });

      it("parses nested sums, multiplications and divisions", () => {
        const ast = parser.parse("const foo=1+2*3-4/5+6");

        console.dir(ast.value, { depth: Infinity });
        expect(ast.value).toEqual<VariableDeclaration["value"]>({
          type: "SumOperation",
          left: { type: "NumericLiteral", value: 1 },
          right: {
            type: "SubOperation",
            left: {
              type: "MultiplicationOperation",
              left: { type: "NumericLiteral", value: 2 },
              right: { type: "NumericLiteral", value: 3 },
            },
            right: {
              type: "SumOperation",
              left: {
                type: "DivisionOperation",
                left: { type: "NumericLiteral", value: 4 },
                right: { type: "NumericLiteral", value: 5 },
              },
              right: { type: "NumericLiteral", value: 6 },
            },
          },
        });
      });

      it("parses nested operations with parenthesis", () => {
        const ast = parser.parse("const foo=(1+2)*3");

        expect(ast.value).toEqual<VariableDeclaration["value"]>({
          type: "MultiplicationOperation",
          left: {
            type: "SumOperation",
            left: { type: "NumericLiteral", value: 1 },
            right: { type: "NumericLiteral", value: 2 },
          },
          right: { type: "NumericLiteral", value: 3 },
        });
      });
    });
  });
});

/**
 *
 * {
 *   type: "VariableDeclaration",
 *   declarator: "const",
 *   variableName: "foo",
 *   value: { type: "NumberLiteral", value: 1 }
 * }
 *  */
