import * as React from "react";
import { observable } from "mobx";
import { observer } from "mobx-react";
import { Popover } from "material-ui";
import {
  dependencies,
  DiComponent,
  IConditionExprComponent,
  IConfigAccessor
} from "./Types";
import {
  GroupContainer,
  GroupBody,
  ExprRow,
  colors,
  GroupHeader,
  OperationName,
  CompactMenu,
  OperandText,
  MenuSelectable
} from "./Style";
import {
  CriteriaGroup,
  Criterion,
  IExpression
} from "../Models/ExpressionModels";
import { ExprConstructor } from "../Models/CodeBuilderModels";

@dependencies("builder")
@observer
export class CriteriaGroupEditor extends DiComponent<
  IConditionExprComponent<CriteriaGroup>,
  IConfigAccessor
> {
  private labelRef = React.createRef<HTMLAnchorElement>();
  @observable
  private selectingType = false;
  render() {
    const { model } = this.props;
    return (
      <GroupContainer>
        {this.renderHeader()}
        <GroupBody>
          {model.criteria.map((c, i) => (
            <ExprRow key={i.toString()}>
              {this.dep.builder.editorFactory.renderExpr(c, {
                remove: () => this.removeChild(c)
              })}
            </ExprRow>
          ))}
          {this.renderAddRow()}
        </GroupBody>
      </GroupContainer>
    );
  }
  renderHeader() {
    const { connector, negate } = this.props.model,
      color = negate
        ? colors.labels.blue
        : connector === "and"
        ? colors.labels.purple
        : colors.labels.teal,
      text =
        negate && connector === "and"
          ? "NOT ALL"
          : negate && connector === "or"
          ? "NOT ANY"
          : connector === "and"
          ? "AND"
          : "OR";

    return (
      <GroupHeader color={color}>
        <OperationName
          ref={this.labelRef}
          color={color}
          onClick={() => (this.selectingType = true)}
        >
          {text}
        </OperationName>
        <Popover
          open={this.selectingType && !this.dep.builder.viewOnly()}
          anchorEl={this.labelRef.current}
          onClose={() => (this.selectingType = false)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
        >
          <CompactMenu>{this.renderOptions()}</CompactMenu>
        </Popover>
      </GroupHeader>
    );
  }
  renderAddRow() {
    return this.dep.builder.viewOnly() ? null : (
      <ExprRow>
        <OperandText tabbable onClick={() => this.addChild(Criterion)}>
          <i className="fa fa-plus" />
          Add Rule
        </OperandText>
        <OperandText tabbable onClick={() => this.addChild(CriteriaGroup)}>
          <i className="fa fa-plus" />
          Add Group
        </OperandText>
        <OperandText
          tooltip="Remove Group"
          onClick={() => this.props.remove()}
          order={3}
        >
          <i className="fa fa-trash" />
        </OperandText>
      </ExprRow>
    );
  }
  private removeChild(expr: IExpression) {
    this.props.model.remove(expr);
    this.dep.builder.raiseChange(this.props.model);
  }
  private addChild(childType: ExprConstructor) {
    const child = this.dep.builder.createDefaultExpr(
      childType,
      this.props.model
    );
    if (child) {
      this.props.model.add(child);
    }
    this.dep.builder.raiseChange(this.props.model);
  }
  private renderOptions() {
    return [
      { text: "AND", type: "and", negate: false },
      { text: "OR", type: "or", negate: false },
      { text: "NOT ALL", type: "and", negate: true },
      { text: "NOT ANY", type: "or", negate: true }
    ].map((o) => (
      <MenuSelectable
        key={o.text}
        selected={
          this.props.model.connector === o.type &&
          this.props.model.negate === o.negate
        }
        onClick={() => this.selectType(o.type, o.negate)}
        text={o.text}
      />
    ));
  }
  private selectType(connector: string, negate: boolean) {
    this.props.model.connector = connector as "and" | "or";
    this.props.model.negate = negate;
    this.selectingType = false;
    this.dep.builder.raiseChange(this.props.model);
  }
}
