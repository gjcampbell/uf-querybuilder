import * as React from "react";
import { observer } from "mobx-react";
import { Typography } from "material-ui";
import { UfOperator } from "../Models/CodeBuilderModels";
import { dependencies, IConfigAccessor, DiComponent } from "./Types";
import { OperandTextEl, OperandEl, colors, Prompt } from "./Style";
import { FilterableTree } from "./Tree";

interface IOperatorElProps {
  operator?: UfOperator;
  availableOps: UfOperator[];
  onOperatorSelected: (op: UfOperator) => void;
}

@dependencies("builder")
@observer
export class OperatorEditor extends DiComponent<
  IOperatorElProps,
  IConfigAccessor
> {
  render() {
    return this.dep.builder!.viewOnly() ? (
      <OperandTextEl italic={true} color={colors.text.blue}>
        {this.getText()}
      </OperandTextEl>
    ) : (
      <OperandEl italic={true} color={colors.text.blue}>
        {{
          text: this.getText(),
          editor: (close) => this.renderOperatorPicker(close)
        }}
      </OperandEl>
    );
  }
  renderOperatorPicker(close: () => void) {
    return (
      <Prompt>
        <FilterableTree
          height={400}
          focus
          noHierarchy
          containerStyle={{ width: "200px" }}
          filterLabel="Find Operator..."
          items={this.props.availableOps}
          childrenAccessor={() => []}
          emptyText={<Typography>No operators match the filter</Typography>}
          textAccessor={(o: UfOperator) => o.ufName}
          onNodeClick={(op: UfOperator) =>
            this.handleOperatorSelected(op, close)
          }
        />
      </Prompt>
    );
  }
  handleOperatorSelected(op: UfOperator, close: () => void) {
    this.props.onOperatorSelected(op);
    close();
  }
  private getText() {
    return this.props.operator
      ? this.props.operator.ufName
      : "[Nothing Selected]";
  }
}
