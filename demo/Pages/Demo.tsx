import * as React from 'react';
import CodeBuilderEditor from '../../src/Components/CodeBuilderEditor';
import { CodeBuilder, ExprConstructor, IOperationConfig } from '../../src/Models/CodeBuilderModels';
import { NestedField, TypeName, Criterion, OpIds, Parameter, CriteriaGroup, IExpression } from '../../src/Models/ExpressionModels';

const operations: IOperationConfig[] = [
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
        name: 'from',
        ufName: 'List',
        defaultOperands: () => [NestedField],
        parameters: [{ name: 'of', type: TypeName.string | TypeName.number, description: 'whast' }],
        returnType: TypeName.array
    }
];

export default class Demo extends React.Component {
    private builder = new CodeBuilder({
        dataSource: { fields: [] },
        operations: operations,
        createDefaultExpr: (type, parent) => this.createExpr(type, parent)
    });
    render() {
        return <CodeBuilderEditor builder={this.builder} onChange={() => {}} />;
    }
    componentDidMount() {
        this.builder.setFields([
            new NestedField(['name'], false, TypeName.string),
            new NestedField(['sizes', 'us'], false, TypeName.number),
            new NestedField(['sizes', 'uk'], false, TypeName.number),
            new NestedField(['sizes'], false, TypeName.array)
        ]);
    }
    createExpr(type: ExprConstructor, parent?: IExpression) {
        if (type === Criterion) {
            return new Criterion(new NestedField(['name'], undefined, TypeName.string), OpIds.Eq, new Parameter('some text', TypeName.string));
        } else if (type === CriteriaGroup) {
            if (parent instanceof CriteriaGroup) {
                const result = new CriteriaGroup();
                result.connector = parent.connector === 'and' ? 'or' : 'and';
                return result;
            }
        }
    }
}
