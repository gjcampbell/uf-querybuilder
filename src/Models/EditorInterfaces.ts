import * as React from 'react';
import { IExpression, OpIds } from './ExpressionModels';

export interface IExprEditorFactory {
    renderReplaceableExpr(model: IExpression, update: (model: IExpression) => void, moreProps?: any): React.ReactNode;
    renderExpr(model: IExpression, moreProps?: any): React.ReactNode;
    renderValueEditor(model: IExpression, opposite?: IExpression, operator?: OpIds, moreProps?: any): React.ReactNode;
    canRender(model: IExpression): boolean;
}
