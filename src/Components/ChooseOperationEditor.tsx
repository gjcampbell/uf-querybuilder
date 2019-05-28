import * as React from 'react';
import { observer } from 'mobx-react';
import { dependencies, DiComponent, IExprComponent, IConfigAccessor } from './Types';
import {
    ChooseOperation,
    IExpression,
    CriteriaGroup,
    Criterion,
    NestedField,
    Parameter,
    IfOperation,
    IConditionalExpression,
    copyExpr
} from '../Models/ExpressionModels';
import { GroupContainer, GroupHeader, OperationName, GroupBody, ExprRow, OperandText, ExprRowLabel, EmptyText, colors } from './Style';
import ExprPicker from './ExprPicker';
import { ExprConstructor } from '../Models/CodeBuilderModels';

@dependencies('builder')
@observer
export default class ChooseOperationEditor extends DiComponent<IExprComponent<ChooseOperation>, IConfigAccessor> {
    render() {
        return (
            <GroupContainer>
                <GroupHeader color={colors.labels.indigo}>
                    <OperationName color={colors.labels.indigo}>Choose</OperationName>
                </GroupHeader>
                <GroupBody>
                    {this.renderBody()}
                    {this.dep.builder.viewOnly() ? null : this.renderAddRow()}
                </GroupBody>
            </GroupContainer>
        );
    }
    renderBody() {
        const operands = this.props.model.operands,
            result = [] as React.ReactNode[];

        for (let i = 0; i < operands.length; i += 2) {
            const when = operands[i],
                then = operands[i + 1];

            result.push(
                <React.Fragment key={i.toString()}>{this.renderWhen(i, when)}</React.Fragment>,
                <React.Fragment key={(i + 1).toString()}>{this.renderThen(i + 1, then)}</React.Fragment>
            );
        }

        return result;
    }
    renderAddRow() {
        return (
            <ExprRow>
                <OperandText tabbable onClick={() => this.addOption()}>
                    <i className="fa fa-plus" />
                    Add Option
                </OperandText>
                <OperandText tooltip="Remove All" onClick={() => this.props.remove()} order={3}>
                    <i className="fa fa-trash" />
                </OperandText>
            </ExprRow>
        );
    }
    renderWhen(idx: number, expr?: IExpression) {
        return (
            <ExprRow>
                <ExprRowLabel color={colors.labels.indigo}>when</ExprRowLabel>
                {expr ? this.dep.builder.editorFactory.renderExpr(expr, this.createUpdateProps(idx)) : this.renderBlankWhen(idx)}
            </ExprRow>
        );
    }
    renderBlankWhen(idx: number) {
        return (
            <>
                <OperandText onClick={() => this.setCondition(CriteriaGroup, idx)}>
                    <i className="fa fa-plus" />
                    Add group
                </OperandText>
                <OperandText onClick={() => this.setCondition(Criterion, idx)}>
                    <i className="fa fa-plus" />
                    Add Rule
                </OperandText>
                <OperandText tooltip="Remove when-then" onClick={() => this.removeWhenThen(idx)} order={3}>
                    <i className="fa fa-trash" />
                </OperandText>
            </>
        );
    }
    renderThen(idx: number, expr?: IExpression) {
        return (
            <ExprRow>
                <ExprRowLabel color={colors.labels.indigo}>then</ExprRowLabel>
                {expr ? this.dep.builder.editorFactory.renderExpr(expr, this.createUpdateProps(idx)) : this.renderBlankThen(idx)}
            </ExprRow>
        );
    }
    renderBlankThen(idx: number) {
        const options = this.dep.builder.getExprOptions(this.props.model);
        return this.dep.builder.viewOnly() ? (
            <EmptyText />
        ) : (
            <ExprPicker color={colors.labels.indigo} options={options} onCreated={e => this.props.model.setOperand(idx, e)} />
        );
    }
    addOption() {
        const { model } = this.props;
        if (model.operands.length > 1) {
            const copy = copyExpr(model.operands[model.operands.length - 2]);
            model.operands.push(copy, this.buildType(Parameter));
        } else {
            model.operands.push(this.buildType(Criterion), this.buildType(Parameter));
        }
        this.dep.builder.raiseChange(model);
    }
    createUpdateProps(idx: number) {
        return {
            remove: () => this.props.model.setOperand(idx, undefined),
            update: (expr: IExpression) => this.props.model.setOperand(idx, expr)
        };
    }
    private removeWhenThen(idx: number) {
        this.props.model.operands.splice(idx, 2);
        this.dep.builder.raiseChange(this.props.model);
    }
    private setCondition(childType: ExprConstructor, idx: number) {
        const condition = this.buildType(childType);
        this.props.model.setOperand(idx, condition as IConditionalExpression);
        this.dep.builder.raiseChange(this.props.model);
    }
    private buildType(childType: ExprConstructor) {
        return this.dep.builder.createDefaultExpr(childType, this.props.model);
    }
}
