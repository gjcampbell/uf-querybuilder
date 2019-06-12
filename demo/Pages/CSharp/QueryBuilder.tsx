import * as React from 'react';
import CodeBuilderEditor from '../../../src/Components/CodeBuilderEditor';
import { CodeBuilder, ExprConstructor, IOperationConfig, IOperationParam, IExprOption } from '../../../src/Models/CodeBuilderModels';
import {
    NestedField,
    TypeName,
    Criterion,
    OpIds,
    Parameter,
    CriteriaGroup,
    IExpression,
    IfOperation,
    Operation,
    ChooseOperation,
    Expr
} from '../../../src/Models/ExpressionModels';
import CriteriaGroupEditor from '../../../src/Components/CriteriaGroupEditor';
import { Section } from '../../Styles';
import { Button, Typography } from '@material-ui/core';
import defaultExprEditorFactory from '../../../src/Components/DefaultExprEditorFactory';
import { IExprEditorFactory } from '../../../src/Models/EditorInterfaces';
import { dependencies } from '../../../src/Components/Types';
import { observer } from 'mobx-react';

const filterOperation = {
    name: 'filter',
    ufName: 'Filter',
    defaultOperands: () => [CriteriaGroup],
    parameters: [{ name: 'by', type: TypeName.boolean, editorType: CriteriaGroupEditor as any }],
    returnType: TypeName.boolean,
    layoutVertically: true
};

const maxOp = {
        name: 'max',
        ufName: 'Largest',
        defaultOperands: () => [NestedField],
        parameters: [{ name: 'of', type: TypeName.array }],
        returnType: TypeName.number
    },
    minOp = {
        name: 'min',
        ufName: 'Smallest',
        defaultOperands: () => [NestedField],
        parameters: [{ name: 'of', type: TypeName.array }],
        returnType: TypeName.number
    },
    sumOp = {
        name: 'sum',
        ufName: 'Sum',
        defaultOperands: () => [NestedField],
        parameters: [{ name: 'of', type: TypeName.number }],
        returnType: TypeName.number
    },
    avgOp = {
        name: 'avg',
        ufName: 'Average',
        defaultOperands: () => [NestedField],
        parameters: [{ name: 'of', type: TypeName.number }],
        returnType: TypeName.number
    },
    roundOp = {
        name: 'round',
        ufName: 'Round',
        defaultOperands: () => [NestedField],
        parameters: [{ name: 'of', type: TypeName.number }],
        returnType: TypeName.number
    },
    fromOp = {
        name: 'from',
        ufName: 'List',
        defaultOperands: () => [NestedField],
        parameters: [{ name: 'of', type: TypeName.string | TypeName.number, description: 'whast' }],
        returnType: TypeName.array
    },
    operations: IOperationConfig[] = [minOp, maxOp, sumOp, avgOp, roundOp, fromOp];

const editorFactory = {
    canRender: defaultExprEditorFactory.canRender,
    renderReplaceableExpr: defaultExprEditorFactory.renderReplaceableExpr,
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
        createDefaultExpr: (type, parent) => this.createExpr(type, parent),
        editorFactory: undefined,
        onChange: () => this.handleCodeChange()
    });
    render() {
        return (
            <>
                <Section pad>
                    <Typography variant="h5">Query Builder</Typography>
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
    createExpr(type: ExprConstructor, parent?: IExpression) {
        if (type === Criterion) {
            return new Criterion(new NestedField(['name'], undefined, TypeName.string), OpIds.Like, new Parameter('mex*', TypeName.string));
        } else if (type === CriteriaGroup) {
            if (parent instanceof CriteriaGroup) {
                const result = new CriteriaGroup();
                result.connector = parent.connector === 'and' ? 'or' : 'and';
                return result;
            }
        }
    }

    private clear() {
        this.builder.code = undefined;
        this.handleCodeChange();
    }
}

@Expr('Operation', e => e.name.toLowerCase() === 'if')
class MathOperation extends Operation {}

@dependencies('builder', 'highlight')
@observer
class MathEditor extends React.Component {}
