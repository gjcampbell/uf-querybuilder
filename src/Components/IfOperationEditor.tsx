import * as React from 'react';
import { observer } from 'mobx-react';
import { dependencies, DiComponent, IExprComponent, IConfigAccessor } from './Types';
import { IfOperation, IExpression, CriteriaGroup, Criterion, NestedField, Parameter, IConditionalExpression } from '../Models/ExpressionModels';
import { GroupContainer, GroupHeader, OperationName, GroupBody, ExprRow, ExprRowLabel, EmptyText, OperandText, colors } from './Style';
import ExprPicker from './ExprPicker';
import { ExprConstructor } from '../Models/CodeBuilderModels';

@dependencies('builder')
@observer
export default class IfOperationEditor extends DiComponent<IExprComponent<IfOperation>, IConfigAccessor> {
    render() {
        const { condition, ifFalse, ifTrue } = this.props.model;
        return (
            <GroupContainer>
                <GroupHeader color={colors.labels.indigo}>
                    <OperationName color={colors.labels.indigo}>If</OperationName>
                </GroupHeader>
                <GroupBody>
                    <ExprRow>
                        {condition
                            ? this.dep.builder.editorFactory.renderExpr(condition, {
                                  remove: () => this.doUpdate(() => (this.props.model.condition = undefined))
                              })
                            : this.renderCriteriaBlank()}
                    </ExprRow>
                    <ExprRow>
                        <ExprRowLabel color={colors.labels.indigo}>then</ExprRowLabel>
                        {ifTrue
                            ? this.dep.builder.editorFactory.renderExpr(ifTrue, {
                                  update: (e: IExpression) => this.doUpdate(() => (this.props.model.ifTrue = e)),
                                  remove: () => this.doUpdate(() => (this.props.model.ifTrue = undefined))
                              })
                            : this.renderOptionsBlank(e => (this.props.model.ifTrue = e))}
                    </ExprRow>
                    <ExprRow>
                        <ExprRowLabel color={colors.labels.indigo}>otherwise</ExprRowLabel>
                        {ifFalse
                            ? this.dep.builder.editorFactory.renderExpr(ifFalse, {
                                  update: (e: IExpression) => this.doUpdate(() => (this.props.model.ifFalse = e)),
                                  remove: () => this.doUpdate(() => (this.props.model.ifFalse = undefined))
                              })
                            : this.renderOptionsBlank(e => (this.props.model.ifFalse = e))}
                    </ExprRow>
                </GroupBody>
            </GroupContainer>
        );
    }
    renderCriteriaBlank() {
        return this.dep.builder.viewOnly() ? (
            <EmptyText />
        ) : (
            <ExprRow>
                <OperandText tabbable onClick={() => this.setCondition(CriteriaGroup)}>
                    <i className="fa fa-plus" />
                    Add group
                </OperandText>
                <OperandText tabbable onClick={() => this.setCondition(Criterion)}>
                    <i className="fa fa-plus" />
                    Add Rule
                </OperandText>
                <OperandText tooltip="Remove If-then-else" onClick={() => this.props.remove()} order={3}>
                    <i className="fa fa-trash" />
                </OperandText>
            </ExprRow>
        );
    }
    renderOptionsBlank(setter: (expr: IExpression) => void) {
        const options = this.dep.builder.getExprOptions(this.props.model);
        return this.dep.builder.viewOnly() ? <EmptyText /> : <ExprPicker onCreated={e => setter(e)} options={options} />;
    }
    private setCondition(childType: ExprConstructor) {
        const condition = this.buildType(childType);
        this.props.model.condition = condition as IConditionalExpression;
        this.dep.builder.raiseChange(this.props.model);
    }
    private buildType(childType: ExprConstructor) {
        return this.dep.builder.createDefaultExpr(childType, this.props.model);
    }
    private doUpdate(updater: () => void) {
        updater();
        this.dep.builder.raiseChange(this.props.model);
    }
}
