import * as React from 'react';
import { observable } from 'mobx';
import { observer, Provider } from 'mobx-react';
import { CodeBuilder } from '../Models/CodeBuilderModels';
import { IExpression, ChooseOperation, IfOperation, Parameter, NestedField, Empty } from '../Models/ExpressionModels';
import { OperandText } from './Style';
import ExprPicker from './ExprPicker';

interface ICodeBuilderElProps {
    builder: CodeBuilder;
    highlightExpr?: IExpression;
    onChange: (code?: IExpression) => void;
}

@observer
export default class CodeBuilderEditor extends React.Component<ICodeBuilderElProps> {
    private defaultScope = [];
    private highlight = observable.object({ expr: undefined }) as { expr?: IExpression };
    private fieldStore = observable.object({ fields: [] }) as { fields: any[] };
    render() {
        return (
            <Provider
                builder={this.props.builder}
                highlight={this.highlight}
                fieldStore={this.fieldStore}
                scope={this.defaultScope}
            >
                <>
                    {this.props.builder.code && this.props.builder.editorFactory.canRender(this.props.builder.code)
                        ? this.props.builder.editorFactory.renderReplaceableExpr(
                              this.props.builder.code,
                              m => this.updateCode(m),
                              {
                                  remove: () => this.updateCode(undefined)
                              }
                          )
                        : this.renderRootSelector()}
                </>
            </Provider>
        );
    }
    renderRootSelector() {
        const allOptions = this.props.builder.getExprOptions(undefined, [
                ChooseOperation,
                IfOperation,
                Parameter,
                NestedField
            ]),
            knownOptions = allOptions.filter(o => o.knownType),
            otherOptions = allOptions.filter(o => !o.knownType);

        return this.props.builder.viewOnly() ? null : (
            <>
                {knownOptions.map((o, i) => (
                    <OperandText key={i.toString()} onClick={() => this.updateCode(o.createExpr())}>
                        <i className="fa fa-plus" /> {' Add ' + (o.ufName || o.name)}
                    </OperandText>
                ))}
                <ExprPicker options={otherOptions} text="Other..." onCreated={e => this.updateCode(e)} />
            </>
        );
    }
    componentDidMount() {
        this.fieldStore.fields = this.props.builder.getFields();
    }
    updateCode(code?: IExpression | null) {
        this.props.onChange(code || undefined);
        this.props.builder.raiseChange(code);
        this.props.builder.code = code || Empty.instance;
    }
    componentDidUpdate(prevProps: ICodeBuilderElProps) {
        if (prevProps.highlightExpr !== this.props.highlightExpr) {
            this.highlight.expr = this.props.highlightExpr;
        }
        this.fieldStore.fields = this.props.builder.getFields();
    }
}
