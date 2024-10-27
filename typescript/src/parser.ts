type NumericLiteral = {
  type: "NumericLiteral";
  value: number;
};

type OperationType =
  | "SumOperation"
  | "SubOperation"
  | "MultiplicationOperation"
  | "DivisionOperation";

type Operation = {
  type: OperationType;
  left: ValueExpression;
  right: ValueExpression;
};

type ValueExpression = NumericLiteral | Operation;
export type VariableDeclaration = {
  type: "VariableDeclaration";
  declarator: string;
  identifier: {
    name: string;
    typeAnnotation?: string;
  };
  value: ValueExpression;
};

export type AST = VariableDeclaration;
export class Parser {
  private tokenizer = new Tokenizer();

  private parsePriorityOperation({
    leftLiteral,
    type,
    noPriorityRightValue,
  }: {
    leftLiteral: ValueExpression;
    type: OperationType;
    noPriorityRightValue: ValueExpression;
  }): Operation {
    if (noPriorityRightValue.type === "NumericLiteral") {
      return {
        type,
        left: leftLiteral,
        right: noPriorityRightValue,
      };
    }

    const noPriorityRightOperation = noPriorityRightValue;

    const left: Operation = {
      type,
      left: leftLiteral,
      right: noPriorityRightOperation.left,
    };

    return {
      type: noPriorityRightOperation.type,
      left,
      right: noPriorityRightOperation.right,
    };
  }

  private parseOperation(left: ValueExpression, rest: string): Operation {
    const { type: nextType, rest: nextRest } =
      this.tokenizer.getNextToken(rest);

    const typeToOperation: Partial<Record<Matcher, OperationType>> = {
      DivisionOperator: "DivisionOperation",
      MinusOperator: "SubOperation",
      MultiplicationOperator: "MultiplicationOperation",
      PlusOperator: "SumOperation",
    };

    const operation = typeToOperation[nextType];

    if (!operation)
      throw new Error(
        `Expected mathematical operator ('+', '-', '*', '/'). Received ${nextType} from ${rest}`
      );

    const right = this.parseValueExpression(nextRest);

    if (
      operation === "MultiplicationOperation" ||
      operation === "DivisionOperation"
    )
      return this.parsePriorityOperation({
        leftLiteral: left,
        type: operation,
        noPriorityRightValue: right,
      });

    return {
      type: operation,
      left,
      right,
    };
  }

  private parseNumericLiteral(program: string): NumericLiteral {
    const { token, type, rest } = this.tokenizer.getNextToken(program);

    if (type === "NumericLiteral") {
      return {
        type: "NumericLiteral",
        value: Number.parseFloat(token),
      };
    }

    if (type === "MinusOperator") {
      const { token: nextToken, type: nextType } =
        this.tokenizer.getNextToken(rest);

      if (nextType !== "NumericLiteral") {
        throw new Error(`Expected a float number. Received '${rest}' instead.`);
      }

      return {
        type: "NumericLiteral",
        value: -Number.parseFloat(nextToken),
      };
    }

    if (type === "PlusOperator") {
      const { token: nextToken, type: nextType } =
        this.tokenizer.getNextToken(rest);

      if (nextType !== "NumericLiteral") {
        throw new Error(`Expected a float number. Received '${rest}' instead.`);
      }

      return {
        type: "NumericLiteral",
        value: Number.parseFloat(nextToken),
      };
    }

    throw new Error(
      `Expected a NumericLiteral. Received '${program}' instead.`
    );
  }

  private parseParenthesisGroup(program: string, rest: string) {
    const expression = this.parseValueExpression(program);
    return this.parseOperation(expression, rest);
  }
  private parseValueExpression(program: string): ValueExpression {
    const { type, rest, token } = this.tokenizer.getNextToken(program);

    if (type === "ParenthesisGroup")
      return this.parseParenthesisGroup(token, rest);

    // we need to handle cases where we declare a float value starting with + or - (example: "const foo = +3.2" )
    if (
      type !== "NumericLiteral" &&
      type !== "MinusOperator" &&
      type !== "PlusOperator"
    )
      throw new Error(
        `Expected a NumericLiteral | '+' | '-'. Received ${type} from '${program}' instead.`
      );

    const { type: nextType, rest: nextRest } =
      this.tokenizer.getNextToken(rest);

    const numericLiteral = this.parseNumericLiteral(program);

    if (nextType === "EOF") return numericLiteral;

    if (!nextRest) return numericLiteral;

    return this.parseOperation(numericLiteral, rest);
  }

  /**
   *
   * @param left
   * @param restOfProgram "= 4 + 5"
   * @returns
   */
  private parseVariableDeclarationRightSide(
    left: Pick<VariableDeclaration, "identifier" | "declarator">,
    restOfProgram: string
  ): VariableDeclaration {
    const { type, token, rest } = this.tokenizer.getNextToken(restOfProgram);

    if (type !== "Equal") {
      throw new Error(
        `Expected '=' character. Received '${restOfProgram}' instead`
      );
    }

    const value = this.parseValueExpression(rest);

    return {
      type: "VariableDeclaration",
      declarator: left.declarator,
      identifier: left.identifier,
      value,
    };
  }

  /**
   *
   * @param program "foo = 1 + 2"
   * @returns
   */
  private parseVariableDeclarator({
    declarator,
    program,
  }: {
    declarator: string;
    program: string;
  }): VariableDeclaration {
    const { token, type, rest } = this.tokenizer.getNextToken(program);

    if (type !== "variableName")
      throw new Error(
        `Expected  a variableName. Received '${program}' instead.`
      );

    const { type: nextType, rest: nextRest } =
      this.tokenizer.getNextToken(rest);

    if (nextType === "Column") {
      const {
        rest: rest2,
        token: typeAnnotation,
        type: typeAnnotationType,
      } = this.tokenizer.getNextToken(nextRest);

      if (typeAnnotationType !== "variableName") {
        throw new Error(
          `Expected a type annotation. Received '${rest}' instead.`
        );
      }

      return this.parseVariableDeclarationRightSide(
        {
          declarator,
          identifier: { name: token, typeAnnotation },
        },
        rest2
      );
    }

    return this.parseVariableDeclarationRightSide(
      {
        declarator,
        identifier: { name: token },
      },
      rest
    );
  }
  parse(program: string) {
    const {
      token: firstToken,
      type,
      rest: restOfProgram,
    } = this.tokenizer.getNextToken(program);

    if (type !== "declarator") throw new Error("Expected declarator");

    return this.parseVariableDeclarator({
      declarator: firstToken,
      program: restOfProgram,
    });
  }
}

const matchers = [
  {
    regex: /^(const|let|var)/m,
    type: "declarator",
  },
  {
    regex: /^([a-zA-Z]+)/m,
    type: "variableName",
  },
  {
    regex: /^(=)/,
    type: "Equal",
  },
  {
    regex: /^((?:[0-9]*[.])?[0-9]+)/,
    type: "NumericLiteral",
  },
  {
    regex: /^(\+)/,
    type: "PlusOperator",
  },
  {
    regex: /^(\-)/,
    type: "MinusOperator",
  },
  {
    regex: /^(\*)/,
    type: "MultiplicationOperator",
  },
  {
    regex: /^(\/)/,
    type: "DivisionOperator",
  },
  {
    regex: /^(\(([^\(\)]+)\))/,
    type: "ParenthesisGroup",
  },
  {
    regex: /^(:)/,
    type: "Column",
  },
] as const satisfies Array<{
  regex: RegExp;
  type: string;
}>;

type Matcher = (typeof matchers)[number]["type"] | "EOF";

function splitIn2(text: string, delimiter: string) {
  const arr = text.split(delimiter);
  const left = arr[0];
  const right = arr.slice(1).join(delimiter);
  return [left, right];
}
class Tokenizer {
  getNextToken(_program: string): {
    token: string;
    rest: string;
    type: Matcher;
  } {
    const program = _program.trimStart();

    if (!program)
      return {
        type: "EOF",
        rest: "",
        token: "",
      };

    for (const matcher of matchers) {
      const match = program.match(matcher.regex);

      if (match) {
        const token = match.length >= 3 ? match[2] : match[1];
        // in some cases (Parenthesis group), we cleanup with the first group (matching everything) but return the second group to ignore some characters (parenthesis)
        const cleanup = match[1];
        const rest = splitIn2(program, cleanup)[1];
        return { token, rest, type: matcher.type };
      }
    }

    throw new Error(`Unrecognized token in string: '${program}'`);
  }
}
