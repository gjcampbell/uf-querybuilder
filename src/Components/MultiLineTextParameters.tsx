import * as React from "react";
import { observer } from "mobx-react";
import { TextField } from "material-ui";
import { IExprComponent, IReplaceableExpr } from "./Types";
import { Parameter } from "../Models/ExpressionModels";
import { BaseParameterEditor, ValueWrapper } from "./BaseParameterEditor";

@observer
export class MultiLineTextParameters extends React.Component<
  IExprComponent<Parameter> & IReplaceableExpr
> {
  render() {
    return (
      <BaseParameterEditor
        {...this.props}
        getText={() => this.getText()}
        getEditorBody={(model) => this.getEditorBody(model)}
        onUpdate={(value) => this.getValue(value)}
        keyedSubmit="modifier"
      />
    );
  }
  getText() {
    return !this.props.model.value || !(this.props.model.value instanceof Array)
      ? "[Not Set]"
      : `[${this.props.model.value.length} Items]`;
  }
  promptSubmitRequiresModifier() {
    return true;
  }
  getEditorBody(model: ValueWrapper) {
    return (
      <div style={{ width: "275px" }}>
        <TextField
          multiline
          autoFocus
          fullWidth
          label="Items to match"
          value={model.value instanceof Array ? model.value.join("\n") : ""}
          onChange={(e) => (model.value = e.target.value.split("\n"))}
          helperText="Add each item to match on a new line"
          rows={10}
        />
      </div>
    );
  }
  getValue(value: any) {
    value = typeof value === "string" ? value.split("\n") : value;
    return value instanceof Array ? value.filter((v) => !!v) : value;
  }
}
