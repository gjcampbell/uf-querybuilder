import * as React from "react";
import { CodeBuilderEditor } from "../../../src/Components/CodeBuilderEditor";
import {
  CodeBuilder,
  ExprConstructor,
  IOperationConfig,
  IOperationParam,
  IExprOption
} from "../../../src/Models/CodeBuilderModels";
import {
  NestedField,
  TypeName,
  Criterion,
  OpIds,
  Parameter,
  CriteriaGroup,
  IExpression
} from "../../../src/Models/ExpressionModels";
import { CriteriaGroupEditor } from "../../../src/Components/CriteriaGroupEditor";
import { Section } from "../../Styles";
import Typography from "material-ui/Typography";
import { Button } from "material-ui";
console.log(
  Button,
  Typography,
  Section,
  CriteriaGroupEditor,
  CodeBuilderEditor
);
const filterOperation = {
  name: "filter",
  ufName: "Filter",
  defaultOperands: () => [CriteriaGroup],
  parameters: [
    {
      name: "by",
      type: TypeName.boolean,
      editorType: CriteriaGroupEditor as any
    }
  ],
  returnType: TypeName.boolean,
  layoutVertically: true
};

const operations: IOperationConfig[] = [
  {
    name: "max",
    ufName: "Largest",
    defaultOperands: () => [NestedField],
    parameters: [{ name: "of", type: TypeName.array }],
    returnType: TypeName.number
  },
  {
    name: "min",
    ufName: "Smallest",
    defaultOperands: () => [NestedField],
    parameters: [{ name: "of", type: TypeName.array }],
    returnType: TypeName.number
  },
  {
    name: "from",
    ufName: "List",
    defaultOperands: () => [NestedField],
    parameters: [
      {
        name: "of",
        type: TypeName.string | TypeName.number,
        description: "whast"
      }
    ],
    returnType: TypeName.array
  }
];

interface IQueryBuilderProps {
  fields: NestedField[];
  onChange: (data: { query?: IExpression }) => void;
}

export class QueryBuilder extends React.Component<IQueryBuilderProps> {
  private builder = new CodeBuilder({
    dataSource: { fields: this.props.fields },
    operations: operations,
    createDefaultExpr: (type, parent) => this.createExpr(type, parent),
    onChange: () => this.handleCodeChange(),
    getExprOptions: (parent, type, param) =>
      this.getExprOptions(parent, type, param)
  });
  render() {
    return (
      <>
        <Section pad>
          <Typography>Query Builder</Typography>
        </Section>
        <Section style={{ textAlign: "right" }}>
          <Button onClick={() => this.clear()}>
            <i className="fa fa-times" />
            Clear Filter
          </Button>
        </Section>
        <Section pad fill>
          <CodeBuilderEditor builder={this.builder} />
        </Section>
      </>
    );
  }
  componentDidUpdate(prevProps: IQueryBuilderProps) {
    if (this.props.fields !== prevProps.fields) {
      this.builder.setFields(this.props.fields);
    }
  }
  handleCodeChange() {
    this.props.onChange({ query: this.builder.code });
  }
  createExpr(type: ExprConstructor, parent?: IExpression) {
    if (type === Criterion) {
      return new Criterion(
        new NestedField(["name"], undefined, TypeName.string),
        OpIds.Like,
        new Parameter("mex*", TypeName.string)
      );
    } else if (type === CriteriaGroup) {
      if (parent instanceof CriteriaGroup) {
        const result = new CriteriaGroup();
        result.connector = parent.connector === "and" ? "or" : "and";
        return result;
      }
    }
  }
  getExprOptions(
    parent?: IExpression,
    type?: TypeName,
    param?: IOperationParam
  ): IExprOption[] | undefined {
    if (!parent) {
      return [
        {
          name: "Rule",
          knownType: true,
          createExpr: () => this.builder.createDefaultExpr(Criterion)!
        },
        {
          name: "Rule Group",
          knownType: true,
          createExpr: () => this.builder.createDefaultExpr(CriteriaGroup)!
        }
      ];
    }
  }
  private clear() {
    this.builder.code = undefined;
    this.handleCodeChange();
  }
}
