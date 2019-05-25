import * as React from 'react';
import { IExpression, IConditionalExpression } from '../Models/ExpressionModels';
import { CodeBuilder } from '../Models/CodeBuilderModels';
import { inject } from 'mobx-react';

export interface IExprComponent<ExprType extends IExpression> {
    model: ExprType;
    remove: () => void;
    label?: { name: string; color: string };
}

export interface IUnknownExprComponent<ExprType extends IExpression> {
    model?: ExprType;
    remove: () => void;
}

export interface IConfigAccessor {
    builder: CodeBuilder;
}

export interface IFieldsAccessor {
    fieldStore: { fields: any[] };
}

export interface IHighlightAccessor {
    highlight: { expr?: IExpression };
}

export interface IScopeAccessor {
    scope: string[];
}

export interface IReplaceableExpr {
    update: (model: IExpression) => void;
}

export interface IConditionExprComponent<ExprType extends IConditionalExpression> extends IExprComponent<ExprType> {}

export class DiComponent<T, S, X = {}> extends React.Component<T, X> {
    public get dep() {
        return (this.props as any) as S;
    }
}

export const dependencies = (
    ...args: Array<keyof (IConfigAccessor & IFieldsAccessor & IHighlightAccessor & IScopeAccessor)>
) => inject(...args);
