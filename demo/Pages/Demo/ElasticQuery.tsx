import * as React from 'react';
import { IExpression, VisitorBase, CriteriaGroup, Empty, Criterion, NestedField, Parameter, Operation, OpIds } from '../../../src/Models/ExpressionModels';
import ExprVisitorElastic from './ExprVisitorElastic';

interface IElasticQueryProps {
    expr: { query?: IExpression };
}

export default class ElasticQuery extends React.Component<IElasticQueryProps> {
    private visitor = new ExprVisitorElastic();
    render() {
        return <pre>{JSON.stringify(this.visitor.visitRoot(this.props.expr.query), undefined, 4)}</pre>;
    }
}
