import * as React from 'react';
import {
    VisitorBase,
    Empty,
    CriteriaGroup,
    Criterion,
    OpIds,
    IExpression,
    NestedField,
    Parameter,
    Operation,
    IfOperation,
    ChooseOperation
} from '../../../src/Models/ExpressionModels';
import styled from 'styled-components';
import { colors } from '../../../src/Components/Style';

export default class ExprVisitorCs extends VisitorBase<React.ReactNode> {
    private indentation = 0;
    private imperative: boolean[] = [];
    private varCount = 0;
    private hoisted: React.ReactNode[][] = [];

    private highlight = (expr?: IExpression) => {};

    private get imperativeAllowed() {
        return this.imperative[0] === true;
    }

    public static visit(expr: IExpression | undefined, highlight: (expr?: IExpression) => void) {
        const visitor = new ExprVisitorCs();
        visitor.highlight = highlight;
        return visitor.visitImperative(expr, node => (
            <>
                {visitor.renderToken('return', colors.text.blue)} {node};
            </>
        ));
    }

    public visitNestedField(expr: NestedField): React.ReactNode {
        return this.renderToken(expr.path.join('.'), colors.text.default, expr);
    }
    public visitEmpty(expr: Empty) {
        return this.renderInvalid(expr);
    }
    public visitCriteriaGroup(expr: CriteriaGroup) {
        const negator = expr.negate ? '!' : '',
            connector = expr.connector === 'and' ? '&&' : '||',
            items: React.ReactNode[] = [],
            multiple = expr.criteria.length > 1,
            useParens = multiple || negator;

        this.indent(() => {
            for (let i = 0; i < expr.criteria.length; i++) {
                let item = this.visitNonImperative(expr.criteria[i]);
                if (i > 0) {
                    items.push(
                        <>
                            {this.renderNewline()} {connector} {item}
                        </>
                    );
                } else {
                    items.push(item);
                }
            }
        });

        return (
            <>
                {negator}
                {useParens ? '(' : ''}
                {items.map((node, i) => (
                    <React.Fragment key={i}>{node}</React.Fragment>
                ))}
                {useParens ? ')' : ''}
            </>
        );
    }
    public visitCriterion(expr: Criterion) {
        let result: React.ReactNode,
            left = this.visitOrInvalid(expr.leftOperand),
            right = expr.rightOperand ? this.visit(expr.rightOperand) : undefined,
            operator = this.getOperator(expr.operator);

        if (operator) {
            result = (
                <>
                    {left}
                    {this.renderToken(` ${operator} `, colors.text.default, expr)}
                    {right || this.renderInvalid()}
                </>
            );
        } else {
            switch (expr.operator) {
                case OpIds.Like:
                    result = (
                        <>
                            {left}.{this.renderToken('Contains', colors.text.default, expr)}({right || this.renderInvalid()})
                        </>
                    );
                    break;
                case OpIds.In:
                    result = (
                        <>
                            {right || this.renderInvalid()}.{this.renderToken('Contains', colors.text.default, expr)}({left})
                        </>
                    );
                    break;
                case OpIds.Null:
                    result = (
                        <>
                            {left}
                            {this.renderToken(' == null', colors.text.default, expr)}
                        </>
                    );
                    break;
                case OpIds.NotNull:
                    result = (
                        <>
                            {left}
                            {this.renderToken(' != null', colors.text.default, expr)}
                        </>
                    );
                    break;
                default:
                    result = this.renderInvalid();
                    break;
            }
        }

        return result;
    }
    private getOperator(op?: OpIds) {
        switch (op) {
            case OpIds.Gte:
                return '>=';
            case OpIds.Gt:
                return '>';
            case OpIds.Lte:
                return '<=';
            case OpIds.Lt:
                return '<';
            case OpIds.Ne:
                return '!=';
            case OpIds.Eq:
                return '==';
            default:
                return null;
        }
    }
    private visitOrInvalid(expr?: IExpression) {
        return expr ? this.visit(expr) : this.renderInvalid();
    }
    public visitParameter(expr: Parameter) {
        if (expr.value instanceof Array) {
            return (
                <>
                    new[] {'{'} {this.renderSeperated(expr.value.map(e => this.renderLiteral(e, expr)), () => ', ')} {'}'}
                </>
            );
        } else {
            return this.renderLiteral(expr.value, expr);
        }
    }
    private renderLiteral(value: object, expr: IExpression) {
        return this.renderToken(`"${value}"`, colors.labels.purple, expr);
    }
    public visitOperation(expr: Operation) {
        switch (expr.name) {
            case 'filter':
                return this.visit(expr.operands[0]);
            case 'if':
                return this.renderIf(expr as IfOperation);
            case 'choose':
                return this.renderChoose(expr);
            default:
                return this.renderDefaultOperation(expr);
        }
    }
    private renderDefaultOperation(expr: Operation) {
        const opName = this.getOperationName(expr.name),
            params = expr.operands.map(o => this.visitNonImperative(o));
        if (opName) {
            return (
                <>
                    {this.renderToken(opName, colors.labels.indigo, expr)}({this.renderSeperated(params, () => ', ')})
                </>
            );
        } else {
            return this.renderInvalid();
        }
    }
    private getOperationName(name: string) {
        switch (name) {
            case 'sum':
                return 'HRBlock.Utils.Sum';
            case 'avg':
                return 'HRBlock.Utils.Average';
            case 'min':
                return 'HRBlock.Utils.Min';
            case 'max':
                return 'HRBlock.Utils.Max';
            case 'round':
                return 'HRBlock.Utils.Round';
            default:
                return undefined;
        }
    }
    private renderIf(expr: IfOperation) {
        const varName = this.createVar(),
            statement = (
                <>
                    {this.renderToken('dynamic', colors.text.blue, expr)} {varName} = null;
                    {this.renderNewline()}
                    {this.renderToken('if', colors.labels.blue, expr)} ({this.visitNonImperative(expr.condition)})
                    {this.curlyBrackets(() =>
                        this.visitImperative(expr.ifTrue, node => (
                            <>
                                {varName} = {node};
                            </>
                        ))
                    )}
                    {this.renderToken('else', colors.labels.blue, expr)}
                    {this.curlyBrackets(() =>
                        this.visitImperative(expr.ifFalse, node => (
                            <>
                                {varName} = {node};
                            </>
                        ))
                    )}
                </>
            );

        this.hoist(statement);
        return varName;
    }
    private renderChoose(expr: ChooseOperation) {
        const varName = this.createVar(),
            statementParts = [];

        for (let i = 0; i < expr.operands.length; i += 2) {
            let condition = expr.operands[i],
                result = expr.operands[i + 1];
            statementParts.push(
                <React.Fragment key={i}>
                    {this.renderToken(i === 0 ? 'if' : 'else if', colors.labels.blue, expr)} ({this.visitNonImperative(condition)})
                    {this.curlyBrackets(() =>
                        this.visitImperative(result, node => (
                            <>
                                {varName} = {node};
                            </>
                        ))
                    )}
                </React.Fragment>
            );
        }

        this.hoist(
            <>
                {this.renderToken('dynamic', colors.text.blue, expr)} {varName} = null;
                {this.renderNewline()}
                {statementParts}
            </>
        );
        return varName;
    }
    public visitRoot(expr?: IExpression) {
        return {
            query: this.visit(expr)
        };
    }
    public visitNull() {
        return null;
    }
    private nonImperative(renderer: () => React.ReactNode) {
        try {
            this.imperative.unshift(false);
            return renderer();
        } finally {
            this.imperative.shift();
        }
    }
    private visitNonImperative(expr?: IExpression) {
        return this.nonImperative(() => this.visit(expr));
    }
    private visitImperative(expr: IExpression | undefined, renderer: (node: React.ReactNode) => React.ReactNode) {
        try {
            this.imperative.unshift(true);
            this.hoisted.unshift([]);
            const node = this.visit(expr);
            return (
                <>
                    {this.renderHoisteds()}
                    {renderer(node)}
                </>
            );
        } finally {
            this.imperative.shift();
        }
    }
    private renderSeperated(nodes: React.ReactNode[], separator: () => React.ReactNode) {
        const result = [];
        for (let i = 0; i < nodes.length; i++) {
            result.push(<React.Fragment key={i}>{nodes[i]}</React.Fragment>);
            if (i < nodes.length - 1) {
                result.push(<React.Fragment key={i + ','}>{separator()}</React.Fragment>);
            }
        }
        return result;
    }
    private curlyBrackets(renderer: () => React.ReactNode) {
        return (
            <>
                {this.renderNewline() + '{'}
                {this.newLineIndent(renderer)}
                {this.renderNewline() + '}'}
                {this.renderNewline()}
            </>
        );
    }
    private indent(renderer: () => React.ReactNode | void) {
        try {
            this.indentation++;
            return renderer();
        } finally {
            this.indentation--;
        }
    }
    private newLineIndent(renderer: () => React.ReactNode) {
        return this.indent(() => (
            <>
                {this.renderNewline()}
                {renderer()}
            </>
        ));
    }
    private renderNewline() {
        return '\n' + Array(this.indentation + 1).join('    ');
    }
    private renderToken(text: string, color: string, expr?: IExpression, bold?: boolean) {
        return (
            <Token color={color} bold={bold} onMouseEnter={() => this.highlight(expr)}>
                {text}
            </Token>
        );
    }
    private renderInvalid(expr?: IExpression) {
        return this.renderToken('[Invalid]', colors.text.error);
    }
    private createVar() {
        return `value${++this.varCount}`;
    }
    private hoist(node: React.ReactNode) {
        this.hoisted[0].push(node);
    }
    private renderHoisteds() {
        const result = this.hoisted[0].map((node, i) => <React.Fragment key={i}>{node}</React.Fragment>);
        this.hoisted.shift();
        return result;
    }
}

const Token = styled.span<{ color: string; bold?: boolean }>`
    color: ${p => p.color};
    font-weight: ${p => (p.bold ? 'bold' : 'normal')};
`;
