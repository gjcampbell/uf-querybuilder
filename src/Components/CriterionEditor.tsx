import * as React from 'react';
import { observer } from 'mobx-react';
import { NestedField, IExpression, Criterion, CriteriaGroup, OpIds, IConditionalExpression, Parameter } from '../Models/ExpressionModels';
import HasInnerMatch from './HasInnerMatch';
import { dependencies, DiComponent, IConditionExprComponent, IConfigAccessor, IHighlightAccessor } from './Types';
import { ExprRow, EmptyText, OperandEl } from './Style';
import { UfOperator } from '../Models/CodeBuilderModels';
import OperatorEditor from './OperatorEditor';
import ExprPicker from './ExprPicker';

const compatibleOpSets = [
    new Set([OpIds.NotNull, OpIds.Null]),
    new Set([OpIds.In]),
    new Set([OpIds.HasAny, OpIds.HasAll, OpIds.HasAll]),
    new Set([OpIds.Eq, OpIds.Ne, OpIds.Gt, OpIds.Gte, OpIds.Lt, OpIds.Lte, OpIds.Like, OpIds])
];

@dependencies('builder', 'highlight')
@observer
export default class CriterionEditor extends DiComponent<IConditionExprComponent<Criterion>, IConfigAccessor & IHighlightAccessor> {
    render() {
        const operator = this.dep.builder.getUfOperator(this.props.model);
        return (
            <ExprRow borderless highlight={this.dep.highlight.expr === this.props.model}>
                {this.renderLeft()}
                <OperatorEditor
                    operator={operator}
                    availableOps={this.dep.builder.getUfOperators(this.props.model)}
                    onOperatorSelected={op => this.handleOperatorSelected(op)}
                />
                {this.renderRight()}
                {this.renderRemove()}
            </ExprRow>
        );
    }
    renderRemove() {
        return this.props.model.rightOperand instanceof CriteriaGroup || this.dep.builder.viewOnly() ? null : (
            <OperandEl noFocus={true} order={3} tooltip="Remove Rule">
                {{ text: <i className="fa fa-trash" onClick={() => this.props.remove()} /> }}
            </OperandEl>
        );
    }
    renderLeft() {
        const setter = (e?: IExpression) => this.handleLeftOpChange(e);
        return this.renderOperand(undefined, this.props.model.leftOperand, setter, false);
    }
    renderRight() {
        const { operator, leftOperand, rightOperand } = this.props.model,
            setter = (e?: IExpression) => {
                this.props.model.rightOperand = e;
                this.dep.builder.raiseChange(this.props.model);
            };
        return !leftOperand || !operator
            ? null
            : operator === OpIds.Null || operator === OpIds.NotNull
            ? null
            : this.operatorIsHas(operator) && leftOperand instanceof NestedField
            ? this.renderHas(leftOperand, setter)
            : this.renderOperand(leftOperand, rightOperand, setter, true);
    }
    renderHas(opposite: NestedField, setter: (expr?: IExpression) => void) {
        return (
            <HasInnerMatch
                parentField={opposite as NestedField}
                model={this.props.model.rightOperand as IConditionalExpression}
                remove={() => (this.props.model.rightOperand = undefined)}
                update={setter}
            />
        );
    }
    renderOperand(opposite: IExpression | undefined, expr: IExpression | undefined, setter: (expr?: IExpression) => void, findBestValueEditor: boolean) {
        let result = null;

        if (expr) {
            const moreProps = { update: setter, remove: () => setter(undefined) };
            if (expr instanceof Parameter && findBestValueEditor) {
                result = this.dep.builder.editorFactory.renderValueEditor(expr, opposite, this.props.model.operator, moreProps);
            } else {
                result = this.dep.builder.editorFactory.renderExpr(expr, moreProps);
            }
        } else {
            result = this.renderEmpty(setter);
        }

        return result;
    }
    renderEmpty(setter: (expr?: IExpression) => void) {
        const options = this.dep.builder.getExprOptions(this.props.model);
        return this.dep.builder.viewOnly() ? <EmptyText /> : <ExprPicker onCreated={e => setter(e)} options={options} />;
    }
    handleLeftOpChange(operand?: IExpression) {
        const prev = this.props.model.leftOperand,
            prevType = prev && prev.getValueType ? prev.getValueType() : undefined,
            newType = operand && operand.getValueType ? operand.getValueType() : undefined;
        this.props.model.leftOperand = operand;
        if (prevType !== newType) {
            this.props.model.operator = undefined;
            this.props.model.rightOperand = undefined;
        }
        this.dep.builder.raiseChange(this.props.model);
    }
    handleOperatorSelected(op: UfOperator) {
        const prevOp = this.props.model.operator,
            newOp = op.id;
        this.props.model.operator = op.id;
        if (this.getCompatibilitySet(prevOp) !== this.getCompatibilitySet(newOp)) {
            if (this.operatorIsHas(newOp)) {
                this.props.model.rightOperand = this.dep.builder.createDefaultExpr(CriteriaGroup, this.props.model)!;
            } else {
                this.props.model.rightOperand = this.dep.builder.createDefaultExpr(Parameter, this.props.model)!;
            }
        }
        this.dep.builder.raiseChange(this.props.model);
    }
    getCompatibilitySet(op?: OpIds) {
        return op ? compatibleOpSets.find(s => s.has(op)) : undefined;
    }
    operatorIsHas(op: OpIds) {
        return op === OpIds.HasAll || op === OpIds.HasNone || op === OpIds.HasAny;
    }
}
