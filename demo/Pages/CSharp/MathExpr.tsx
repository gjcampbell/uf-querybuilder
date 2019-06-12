import * as React from 'react';
import { IOperationConfig } from '../../../src/Models/CodeBuilderModels';
import { NestedField, TypeName, IExpression, Operation, Expr } from '../../../src/Models/ExpressionModels';
import { Tooltip, Popover } from '@material-ui/core';
import { dependencies, DiComponent, IExprComponent, IConfigAccessor, IHighlightAccessor } from '../../../src/Components/Types';
import { observer } from 'mobx-react';
import { computed, observable } from 'mobx';
import ExprPicker from '../../../src/Components/ExprPicker';
import { colors, ExprRow, OperationName, CompactMenu, MenuSelectable } from '../../../src/Components/Style';
import styled from 'styled-components';

export const mathOperationNames = ['add', 'subtract', 'multiply', 'divide', 'modulus', 'exponentiate'];
export const mathOperations = mathOperationNames.map(
    name =>
        ({
            name,
            ufName: `Math (${name})`,
            defaultOperands: () => [NestedField, NestedField],
            parameters: [{ name: 'left', type: TypeName.number }, { name: 'right', type: TypeName.number }],
            returnType: TypeName.number
        } as IOperationConfig)
);

@Expr('Operation', e => mathOperations.indexOf(e.name.toLowerCase()) >= 0)
export class MathOperation extends Operation {
    @computed
    public get left() {
        return this.operands[0];
    }
    public set left(value: IExpression | undefined) {
        this.setOperand(0, value);
    }
    @computed
    public get right() {
        return this.operands[1];
    }
    public set right(value: IExpression | undefined) {
        this.setOperand(1, value);
    }
}

@dependencies('builder', 'highlight')
@observer
export class MathEditor extends DiComponent<IExprComponent<MathOperation>, IConfigAccessor & IHighlightAccessor> {
    private labelRef = React.createRef<HTMLAnchorElement>();

    @observable
    private showingPicker = false;

    render() {
        return (
            <ExprRow borderless noFill highlight={this.dep.highlight.expr === this.props.model}>
                <MathParen left color={colors.labels.purple} />
                {this.renderLeft()}
                {this.renderOperator()}
                {this.renderRight()}
                <MathParen right color={colors.labels.purple} />
            </ExprRow>
        );
    }
    renderLeft() {
        const { model } = this.props,
            setter = (expr?: IExpression) => (model.left = expr);
        return this.renderOperand(model.left, setter);
    }
    renderRight() {
        const { model } = this.props,
            setter = (expr?: IExpression) => (model.right = expr);
        return this.renderOperand(model.right, setter);
    }
    renderOperand(expr: IExpression | undefined, setter: (expr?: IExpression) => void) {
        return <>{expr ? this.dep.builder.editorFactory.renderExpr(expr, { update: setter, remove: () => setter(undefined) }) : this.renderEmpty(setter)}</>;
    }
    renderEmpty(setter: (value?: IExpression) => void) {
        const options = this.dep.builder.getExprOptions(this.props.model, TypeName.number);
        return <ExprPicker color={colors.labels.purple} onCreated={expr => setter(expr)} options={options} text="Pick..." />;
    }
    renderOperator() {
        return (
            <>
                <Tooltip title={`Mathematically ${this.props.model.name}`}>
                    <a href="javascript:" ref={this.labelRef} style={{ color: colors.labels.purple }} onClick={() => (this.showingPicker = true)}>
                        {this.renderOperatorIcon(this.props.model.name)}
                    </a>
                </Tooltip>
                <Popover
                    open={this.showingPicker && !this.dep.builder.viewOnly()}
                    anchorEl={this.labelRef.current}
                    onClick={() => (this.showingPicker = false)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                >
                    <CompactMenu>
                        {this.renderOperatorOptions()}
                        <MenuSelectable
                            selected={false}
                            onClick={this.props.remove}
                            text={
                                <>
                                    <i className="fa fa-trash" /> Remove
                                </>
                            }
                        />
                    </CompactMenu>
                </Popover>
            </>
        );
    }
    renderOperatorOptions() {
        return mathOperationNames.map(name => (
            <MenuSelectable
                key={name}
                selected={this.props.model.name === name}
                onClick={() => this.selectOperation(name)}
                text={
                    <>
                        {this.renderOperatorIcon(name)}
                        {name}
                    </>
                }
            />
        ));
    }
    renderOperatorIcon(name: string) {
        return <i className={`fa fa-${this.getOperatorIconName(name)}`} />;
    }
    selectOperation(name: string) {
        this.props.model.name = name;
        this.showingPicker = false;
    }
    getOperatorIconName(name: string) {
        switch (name) {
            case 'add':
                return 'plus';
            case 'subtract':
                return 'minus';
            case 'multiply':
                return 'times';
            case 'divide':
                return 'divide';
            case 'modulus':
                return 'percent';
            case 'exponentiate':
                return 'chevron-up';
        }
    }
}

const MathParen = styled.div<{ left?: boolean; right?: boolean; color: string }>`
    width: 6px;
    height: 22px;
    border-width: 3px;
    border-left-width: ${p => (p.left ? 3 : 0)}px;
    border-right-width: ${p => (p.right ? 3 : 0)}px;
    border-style: solid;
    border-color: ${p => p.color};
    border-radius: ${p => (p.left ? '10px 0 0 10px' : '0 10px 10px 0')};
`;
