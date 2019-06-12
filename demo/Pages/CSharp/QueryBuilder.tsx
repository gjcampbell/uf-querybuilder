import * as React from 'react';
import CodeBuilderEditor from '../../../src/Components/CodeBuilderEditor';
import { CodeBuilder, ExprConstructor, IOperationConfig } from '../../../src/Models/CodeBuilderModels';
import { NestedField, TypeName, Criterion, OpIds, Parameter, CriteriaGroup, IExpression, Operation, Expr } from '../../../src/Models/ExpressionModels';
import { Section } from '../../Styles';
import { Button, Typography } from '@material-ui/core';
import defaultExprEditorFactory from '../../../src/Components/DefaultExprEditorFactory';
import { IExprEditorFactory } from '../../../src/Models/EditorInterfaces';
import { mathOperations, mathOperationNames, MathOperation, MathEditor } from './MathExpr';

const operations = [
    {
        name: 'max',
        ufName: 'Largest',
        defaultOperands: () => [NestedField],
        parameters: [{ name: 'of', type: TypeName.array }],
        returnType: TypeName.number
    },
    {
        name: 'min',
        ufName: 'Smallest',
        defaultOperands: () => [NestedField],
        parameters: [{ name: 'of', type: TypeName.array }],
        returnType: TypeName.number
    },
    {
        name: 'sum',
        ufName: 'Sum',
        defaultOperands: () => [NestedField],
        parameters: [{ name: 'of', type: TypeName.number }],
        returnType: TypeName.number
    },
    {
        name: 'avg',
        ufName: 'Average',
        defaultOperands: () => [NestedField],
        parameters: [{ name: 'of', type: TypeName.number }],
        returnType: TypeName.number
    },
    {
        name: 'round',
        ufName: 'Round',
        defaultOperands: () => [NestedField, new Parameter(1)],
        parameters: [{ name: 'value', type: TypeName.number }, { name: 'to nearest', type: TypeName.number }],
        returnType: TypeName.number
    },
    {
        name: 'abs',
        ufName: 'Absolute value',
        defaultOperands: () => [NestedField],
        parameters: [{ name: 'of', type: TypeName.number }],
        returnType: TypeName.number
    },
    {
        name: 'ceiling',
        ufName: 'Ceiling',
        defaultOperands: () => [NestedField, new Parameter(1)],
        parameters: [{ name: 'of', type: TypeName.number }, { name: 'by', type: TypeName.number }],
        returnType: TypeName.number
    },
    {
        name: 'floor',
        ufName: 'Floor',
        defaultOperands: () => [NestedField, new Parameter(1)],
        parameters: [{ name: 'of', type: TypeName.number }, { name: 'by', type: TypeName.number }],
        returnType: TypeName.number
    },
    {
        name: 'toupper',
        ufName: 'To Uppercase',
        defaultOperands: () => [NestedField],
        parameters: [{ name: 'text', type: TypeName.string }],
        returnType: TypeName.string
    },
    {
        name: 'tolower',
        ufName: 'To Lowercase',
        defaultOperands: () => [NestedField],
        parameters: [{ name: 'text', type: TypeName.string }],
        returnType: TypeName.string
    },
    {
        name: 'from',
        ufName: 'List',
        defaultOperands: () => [NestedField],
        parameters: [{ name: 'of', type: TypeName.string | TypeName.number, description: 'whast' }],
        returnType: TypeName.array
    },
    ...mathOperations
] as IOperationConfig[];

const editorFactory = {
    canRender: defaultExprEditorFactory.canRender,
    renderReplaceableExpr: (model: IExpression, update: (expr?: IExpression) => void, moreProps?: any) => {
        return editorFactory.renderExpr(model, { update, ...moreProps });
    },
    renderValueEditor: defaultExprEditorFactory.renderValueEditor,
    renderExpr: (model: IExpression, moreProps?: any) => {
        if (model instanceof MathOperation) {
            return <MathEditor model={model} {...moreProps} />;
        } else {
            return defaultExprEditorFactory.renderExpr(model, moreProps);
        }
    }
} as IExprEditorFactory;

interface IQueryBuilderProps {
    fields: NestedField[];
    highlight?: IExpression;
    onChange: (data: { query?: IExpression }) => void;
}

export default class QueryBuilder extends React.Component<IQueryBuilderProps> {
    private builder = new CodeBuilder({
        dataSource: { fields: this.props.fields },
        operations: operations,
        createDefaultExpr: (type, parent, config) => this.createExpr(type, parent, config),
        editorFactory: editorFactory,
        onChange: () => this.handleCodeChange()
    });
    render() {
        return (
            <>
                <Section pad>
                    <Typography variant="h5">Custom Code Builder</Typography>
                </Section>
                <Section style={{ textAlign: 'right' }}>
                    <Button onClick={() => this.clear()}>
                        <i className="fa fa-times" />
                        Clear Filter
                    </Button>
                </Section>
                <Section pad fill>
                    <CodeBuilderEditor highlightExpr={this.props.highlight} builder={this.builder} />
                </Section>
            </>
        );
    }
    componentDidUpdate(prevProps: IQueryBuilderProps) {
        if (this.props.fields !== prevProps.fields) {
            this.builder.setFields(this.props.fields);
        }
    }
    handleCodeChange() {
        this.props.onChange({ query: this.builder.code });
    }
    createExpr(type: ExprConstructor, parent?: IExpression, config?: IOperationConfig) {
        if (type === Criterion) {
            return new Criterion(new NestedField(['Married'], undefined, TypeName.string), OpIds.Like, new Parameter('Y', TypeName.string));
        } else if (type === CriteriaGroup) {
            if (parent instanceof CriteriaGroup) {
                const result = new CriteriaGroup();
                result.connector = parent.connector === 'and' ? 'or' : 'and';
                return result;
            }
        } else if (config && mathOperationNames.indexOf(config.name) >= 0) {
            const result = new MathOperation(config.name, []);
            result.operands.push([this.builder.createDefaultExpr(NestedField, result), this.builder.createDefaultExpr(NestedField, result)]);
            return result;
        }
    }

    private clear() {
        this.builder.code = undefined;
        this.handleCodeChange();
    }
}
