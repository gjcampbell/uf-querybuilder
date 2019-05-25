import * as React from 'react';
import { observer, Provider } from 'mobx-react';
import { IUnknownExprComponent, IReplaceableExpr, dependencies, DiComponent, IConfigAccessor, IFieldsAccessor, IScopeAccessor } from './Types';
import { IConditionalExpression, NestedField, Criterion, CriteriaGroup } from '../Models/ExpressionModels';
import { FillRow, ExprRow, OperandText } from './Style';
import { ExprConstructor, createSortedFieldTree } from '../Models/CodeBuilderModels';

type HasInnerMatchProps = IUnknownExprComponent<IConditionalExpression> & IReplaceableExpr & { parentField: NestedField };

@dependencies('builder', 'fieldStore', 'scope')
@observer
export default class HasInnerMatch extends DiComponent<HasInnerMatchProps, IConfigAccessor & IFieldsAccessor & IScopeAccessor> {
    private scope: string[];

    constructor(props: HasInnerMatchProps) {
        super(props);
        this.scope = [...this.dep.scope, ...this.props.parentField.path];
    }
    render() {
        if (this.hasValidCriteria()) {
            return (
                <FillRow>
                    <Provider fieldStore={{ fields: this.getFields(this.scope) }} scope={this.scope}>
                        {this.dep.builder.editorFactory.renderExpr(this.props.model!, { remove: this.props.remove })}
                    </Provider>
                </FillRow>
            );
        } else {
            return this.renderCriteriaBlank();
        }
    }
    hasValidCriteria() {
        return this.props.model && (this.props.model instanceof Criterion || this.props.model instanceof CriteriaGroup);
    }
    renderCriteriaBlank() {
        return (
            <ExprRow borderless>
                <OperandText onClick={() => this.setCondition(CriteriaGroup)}>
                    <i className="fa fa-plus" />
                    Add group
                </OperandText>
            </ExprRow>
        );
    }
    private setCondition(childType: ExprConstructor) {
        const condition = this.buildType(childType);
        this.props.update(condition as IConditionalExpression);
    }
    private buildType(childType: ExprConstructor) {
        return this.dep.builder.createDefaultExpr(childType, this.props.model);
    }
    private getFields(scope: string[]) {
        const fields = this.dep.builder.getNestedFields().reduce(
            (result, item) => {
                const scopedField = item.tryScope(scope);
                if (scopedField) {
                    result.push(scopedField);
                }

                return result;
            },
            [] as NestedField[]
        );
        return createSortedFieldTree(fields);
    }
}
