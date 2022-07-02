import * as React from "react";
import { observable } from "mobx";
import { observer } from "mobx-react";
import { TextField } from "material-ui";
import { Button } from "material-ui";
import {
  dependencies,
  DiComponent,
  IExprComponent,
  IHighlightAccessor,
  IConfigAccessor,
  IReplaceableExpr
} from "./Types";
import { Parameter } from "../Models/ExpressionModels";
import {
  OperandTextEl,
  OperandEl,
  OperandText,
  colors,
  Prompt,
  PromptFooter
} from "./Style";

interface IBaseParameterEditorProps {
  getText?: () => React.ReactNode;
  getEditorBody?: (model: ValueWrapper) => React.ReactNode;
  onUpdate?: (value: any) => any;
  keyedSubmit?: "modifier" | "disabled";
}

@dependencies("highlight", "builder")
@observer
export class BaseParameterEditor extends DiComponent<
  IExprComponent<Parameter> & IBaseParameterEditorProps,
  IHighlightAccessor & IConfigAccessor
> {
  private wrapper!: ValueWrapper;
  render() {
    return this.dep.builder.viewOnly() ? (
      <OperandTextEl
        color={colors.text.brown}
        highlight={this.dep.highlight.expr === this.props.model}
      >
        {this.props.getText ? this.props.getText() : this.getText()}
      </OperandTextEl>
    ) : (
      <OperandEl
        color={colors.text.brown}
        highlight={this.dep.highlight.expr === this.props.model}
      >
        {{
          text: this.props.getText ? this.props.getText() : this.getText(),
          editor: (close) => this.getEditor(close),
          onOpen: () => this.updateWrapper(),
          onClose: () => this.updateWrapper()
        }}
      </OperandEl>
    );
  }
  componentDidMount() {
    this.updateWrapper();
  }
  private getText(): React.ReactNode {
    const { value } = this.props.model;
    return value === undefined || (typeof value === "string" && value === "")
      ? "[Not Set]"
      : typeof value === "string" && value === " "
      ? "[Space]"
      : value;
  }
  private getEditorBody(model: ValueWrapper) {
    return (
      <TextField
        autoFocus
        value={typeof model.value === "string" ? model.value : ""}
        onChange={(e) => (model.value = e.target.value)}
      />
    );
  }
  private getEditor(close: () => void): React.ReactNode {
    const submit = () => {
      this.updateValue(this.wrapper.value);
      close();
    };
    return (
      <Prompt
        onSubmit={this.props.keyedSubmit !== "disabled" ? submit : undefined}
        submitRequiresModifier={this.props.keyedSubmit === "modifier"}
      >
        {this.props.getEditorBody
          ? this.props.getEditorBody(this.wrapper)
          : this.getEditorBody(this.wrapper)}
        <PromptFooter>
          <Button onClick={submit}>Ok</Button>
          <Button onClick={close}>Cancel</Button>
          <OperandText
            tooltip="Remove Static Value"
            onClick={this.props.remove}
          >
            <i className="fa fa-trash" />
          </OperandText>
        </PromptFooter>
      </Prompt>
    );
  }
  private updateValue(value: object) {
    if (this.props.onUpdate) {
      value = this.props.onUpdate(value);
    }
    this.props.model.value = value;
    this.dep.builder.raiseChange(this.props.model);
  }
  private updateWrapper() {
    this.wrapper = new ValueWrapper(this.props.model.value);
  }
}

export class ValueWrapper {
  @observable
  public value: any;
  constructor(value: any) {
    this.value = value;
  }
}

@observer
export class DefaultValueEditor extends React.Component<
  IExprComponent<Parameter> & IReplaceableExpr
> {
  render() {
    return <BaseParameterEditor {...this.props} />;
  }
}
