import * as React from 'react';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';
import { dependencies, DiComponent, IExprComponent, IConfigAccessor, IHighlightAccessor } from './Types';
import { Operation, Empty, IExpression, NestedField, Parameter, IfOperation } from '../Models/ExpressionModels';
import { IOperationConfig, IOperationParam } from '../Models/CodeBuilderModels';
import { OperandTextEl, OperandEl, OperandText, GroupHeader, GroupBody, ExprRow, GroupContainer, EmptyText, PromptFooter, Prompt, colors } from './Style';
import ExprPicker from './ExprPicker';

@dependencies('builder', 'highlight')
@observer
export default class DefaultOperationEditor extends DiComponent<IExprComponent<Operation>, IConfigAccessor & IHighlightAccessor> {
    @observable
    private options?: IOperationConfig;
    render() {
        const vertical = this.displayVertically(),
            operands = this.renderOperands(),
            operationName = this.dep.builder.viewOnly() ? (
                <OperandTextEl highlight={this.props.model === this.dep.highlight.expr} bold color={colors.labels.teal}>
                    {this.getName()}
                </OperandTextEl>
            ) : (
                <OperandEl highlight={this.props.model === this.dep.highlight.expr} bold color={colors.labels.teal}>
                    {{
                        text: this.getName(),
                        editor: close => (
                            <Prompt>
                                <Typography>Remove this?</Typography>
                                <PromptFooter>
                                    <OperandText tabbable tooltip={`Remove ${this.getName()}`} onClick={() => this.handleRemove(close)}>
                                        <i className="fa fa-trash" />
                                    </OperandText>
                                </PromptFooter>
                            </Prompt>
                        )
                    }}
                </OperandEl>
            ),
            content = (
                <>
                    {!vertical ? operationName : <GroupHeader color={colors.labels.teal}>{operationName}</GroupHeader>}
                    {!vertical ? (
                        operands
                    ) : (
                        <GroupBody>
                            {operands.map((o, i) => (
                                <ExprRow color={colors.labels.teal} key={i.toString()}>
                                    {o}
                                </ExprRow>
                            ))}
                        </GroupBody>
                    )}
                </>
            );

        return vertical ? (
            <GroupContainer>{content}</GroupContainer>
        ) : (
            <ExprRow noFill borderless>
                {content}
            </ExprRow>
        );
    }
    renderOperands() {
        const operands = this.props.model.operands.reduce((result, item, idx) => {
            const opConfig = this.options && this.options.parameters ? this.options.parameters[idx] : undefined;

            if (!item || item instanceof Empty) {
                result.push(this.renderEmptyOperand(idx, opConfig));
            } else if (!opConfig) {
                result.push(this.renderDefaultOperand(item, idx));
            } else {
                result.push(this.renderOperand(item, opConfig, idx));
            }

            return result;
        }, []) as React.ReactNode[];

        return operands;
    }
    renderDefaultOperand(expr: IExpression, idx: number) {
        return <React.Fragment key={idx.toString()}>{this.dep.builder.editorFactory.renderExpr(expr, this.createOperandElProps(idx))}</React.Fragment>;
    }
    renderOperand(expr: IExpression, config: IOperationParam, idx: number) {
        const Type = config.editorType,
            editProps = this.createOperandElProps(idx),
            exprEditor = Type ? <Type model={expr} {...editProps} /> : this.dep.builder.editorFactory.renderExpr(expr, editProps);

        let text = config.name ? (
            <OperandTextEl unclickable color={colors.labels.teal}>
                {config.name}
            </OperandTextEl>
        ) : (
            undefined
        );
        if (config.description && text) {
            return (
                <React.Fragment key={idx.toString()}>
                    <Tooltip key={idx.toString()} title={config.description}>
                        {text}
                    </Tooltip>
                    {exprEditor}
                </React.Fragment>
            );
        } else {
            return (
                <React.Fragment key={idx.toString()}>
                    {text}
                    {exprEditor}
                </React.Fragment>
            );
        }
    }
    renderEmptyOperand(idx: number, config?: IOperationParam) {
        const options = this.dep.builder.getExprOptions(this.props.model, config ? config.type : undefined, config);

        return this.dep.builder.viewOnly() ? (
            <OperandTextEl>
                {config ? config.name : null}
                <EmptyText />
            </OperandTextEl>
        ) : (
            <ExprPicker
                key={idx}
                color={colors.labels.teal}
                text={config && config.name ? config.name + '...' : undefined}
                tooltip={config ? config.description : undefined}
                options={options}
                onCreated={expr => this.props.model.setOperand(idx, expr)}
            />
        );
    }
    createOperandElProps(idx: number) {
        return {
            update: (expr?: IExpression) => {
                this.props.model.setOperand(idx, expr);
                this.dep.builder.raiseChange(this.props.model);
            },
            remove: () => {
                this.props.model.setOperand(idx, undefined);
                this.dep.builder.raiseChange(this.props.model);
            }
        };
    }
    getName() {
        return this.options ? this.options.ufName || this.options.name : this.props.model.name;
    }
    componentDidMount() {
        this.options = this.dep.builder.getOperationConfig(this.props.model.name);
    }
    handleRemove(close: () => void) {
        this.props.remove();
        close();
    }
    displayVertically() {
        return this.props.model.operands.length > 1 && this.props.model.operands.some(o => o && o instanceof Operation);
    }
}
