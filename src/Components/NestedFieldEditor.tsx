import * as React from 'react';
import { observer } from 'mobx-react';
import Typography from '@material-ui/core/Typography';
import { dependencies, DiComponent, IExprComponent, IReplaceableExpr, IConfigAccessor, IFieldsAccessor, IHighlightAccessor } from './Types';
import { OperandTextEl, OperandEl, OperandText, Prompt, PromptFooter } from './Style';
import { FilterableTree } from './Tree';
import { FieldTreeNode } from '../Models/CodeBuilderModels';
import { NestedField as NestedFieldModel } from '../Models/ExpressionModels';

@dependencies('builder', 'fieldStore', 'highlight')
@observer
export default class NestedFieldEditor extends DiComponent<
    IExprComponent<NestedFieldModel> & IReplaceableExpr,
    IConfigAccessor & IFieldsAccessor & IHighlightAccessor
> {
    render() {
        const tooltip = this.props.model.getName() !== this.props.model.getFullName() ? `Full Name: ${this.props.model.getFullName()}` : undefined;
        return this.dep.builder.viewOnly() ? (
            <OperandTextEl bold highlight={this.dep.highlight.expr === this.props.model}>
                {this.props.model.getName()}
            </OperandTextEl>
        ) : (
            <OperandEl bold tooltip={tooltip} highlight={this.dep.highlight.expr === this.props.model}>
                {{
                    text: this.props.model ? this.props.model.getName() : '[Pick a field]',
                    editor: (close: () => void) => this.renderFieldPicker(close)
                }}
            </OperandEl>
        );
    }
    renderFieldPicker(close: () => void) {
        return (
            <Prompt style={{ width: '280px' }}>
                <FilterableTree
                    focus
                    height={400}
                    scrollPanelStyle={{ minHeight: '130px', maxHeight: '400px' }}
                    filterLabel="Find Field..."
                    filterHelpText="Find fields from the sample data. "
                    items={this.dep.fieldStore.fields}
                    emptyText={<Typography>No fields match the filter</Typography>}
                    childrenAccessor={(n: FieldTreeNode) => n.children}
                    textAccessor={(n: FieldTreeNode) => n.name}
                    onNodeClick={(n: FieldTreeNode) => this.selectField(n, close)}
                />
                <PromptFooter>
                    <OperandText tooltip="Remove Field Value" onClick={() => this.props.remove()} order={3}>
                        <i className="fa fa-trash" />
                    </OperandText>
                </PromptFooter>
            </Prompt>
        );
    }
    selectField(selection: FieldTreeNode, close: () => void) {
        this.props.update(selection.field.copy());
        this.dep.builder.raiseChange(this.props.model);
        close();
    }
}
