import * as React from "react";
import {
  CriteriaGroup,
  IExpression,
  OpIds,
  Criterion,
  NestedField,
  Parameter,
  IfOperation,
  ChooseOperation,
  Operation
} from "../Models/ExpressionModels";
import { IExprEditorFactory } from "../Models/EditorInterfaces";
import { CriteriaGroupEditor } from "./CriteriaGroupEditor";
import { CriterionEditor } from "./CriterionEditor";
import { NestedFieldEditor } from "./NestedFieldEditor";
import { DefaultValueEditor } from "./BaseParameterEditor";
import { IfOperationEditor } from "./IfOperationEditor";
import { ChooseOperationEditor } from "./ChooseOperationEditor";
import { DefaultOperationEditor } from "./DefaultOperationEditor";
import { MultiLineTextParameters } from "./MultiLineTextParameters";
import { HasInnerMatch } from "./HasInnerMatch";

const canRender = (model: IExpression) => {
  return !!ExprFactory(model);
};
const renderReplaceableExpr = (
  model: IExpression,
  update: (model: IExpression) => void,
  moreProps?: any
) => {
  return renderExpr(model, { ...moreProps, update });
};
const renderExpr = (model: IExpression, moreProps?: any) => {
  const ElType = ExprFactory(model) as any;
  return <ElType model={model} {...moreProps} />;
};
const renderValueEditor = (
  model: IExpression,
  opposite?: IExpression,
  operator?: OpIds,
  moreProps?: any
) => {
  const ElType = ValueEditorFactory(operator, opposite) as any;
  return <ElType model={model} {...moreProps} />;
};
const ExprFactory = (type: IExpression) => {
  if (type instanceof CriteriaGroup) return CriteriaGroupEditor;
  if (type instanceof Criterion) return CriterionEditor;
  if (type instanceof NestedField) return NestedFieldEditor;
  if (type instanceof Parameter) return DefaultValueEditor;
  if (type instanceof IfOperation) return IfOperationEditor;
  if (type instanceof ChooseOperation) return ChooseOperationEditor;
  if (type instanceof Operation) return DefaultOperationEditor;
};
const ValueEditorFactory = (
  operator?: OpIds,
  oppositeOperand?: IExpression
) => {
  const typeHint =
    oppositeOperand && oppositeOperand.getValueType
      ? oppositeOperand.getValueType()
      : undefined;
  switch (operator) {
    case OpIds.In:
      return MultiLineTextParameters;
    case OpIds.HasAny:
    case OpIds.HasAll:
    case OpIds.HasNone:
      return HasInnerMatch;
    default:
      return DefaultValueEditor;
  }
};

const defaultExprEditorFactory = {
  canRender,
  renderReplaceableExpr,
  renderExpr,
  renderValueEditor
} as IExprEditorFactory;
export default defaultExprEditorFactory;
