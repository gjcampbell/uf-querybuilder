import * as React from 'react';
import { FilterableTree } from './Tree';
import { Prompt, OperandEl } from './Style';
import { IExprOption } from '../Models/CodeBuilderModels';
import { IExpression } from '../Models/ExpressionModels';

interface IExprPickerProps {
    text?: React.ReactNode;
    tooltip?: string;
    options: IExprOption[];
    color?: string;
    onPick?: (option: IExprOption) => void;
    onCreated?: (option: IExpression) => void;
}

export default class ExprPicker extends React.Component<IExprPickerProps> {
    render() {
        return (
            <OperandEl tooltip={this.props.tooltip} color={this.props.color}>
                {{
                    text: this.renderText(),
                    editor: close => this.renderPicker(close)
                }}
            </OperandEl>
        );
    }
    renderText() {
        return this.props.text ? (
            this.props.text
        ) : (
            <>
                <i className="fa fa-plus" />
                Pick...
            </>
        );
    }
    renderPicker(close: () => void) {
        return (
            <Prompt>
                <FilterableTree
                    focus
                    noHierarchy
                    height={300}
                    childrenAccessor={() => []}
                    items={this.props.options}
                    textAccessor={(o: IExprOption) => o.ufName || o.name}
                    onNodeClick={(o: IExprOption) => this.handleClick(o, close)}
                    filterLabel="Operation Name"
                />
            </Prompt>
        );
    }
    handleClick(option: IExprOption, close: () => void) {
        if (this.props.onPick) {
            this.props.onPick(option);
        }
        if (this.props.onCreated) {
            this.props.onCreated(option.createExpr());
        }
        close();
    }
}
