import { VisitorBase, Empty, CriteriaGroup, Criterion, OpIds, IExpression, NestedField, Parameter, Operation } from '../../../src/Models/ExpressionModels';

export default class ExprVisitorElastic extends VisitorBase<any> {
    public visitEmpty(expr: Empty) {
        return {};
    }
    public visitCriteriaGroup(expr: CriteriaGroup) {
        const criteria = expr.criteria.map(c => this.visit(c)),
            op = expr.connector === 'or' && expr.negate ? 'must_not' : expr.connector === 'and' ? 'must' : expr.connector === 'or' ? 'should' : '';

        if (expr.connector === 'and' && expr.negate) {
            return {
                bool: {
                    must_not: {
                        bool: {
                            must: criteria
                        }
                    }
                }
            };
        } else {
            return {
                bool: {
                    [op]: criteria
                }
            };
        }
    }
    public visitCriterion(expr: Criterion) {
        let negate = false,
            result = {};

        switch (expr.operator) {
            case OpIds.Gte:
            case OpIds.Gt:
            case OpIds.Lte:
            case OpIds.Lt:
                let op = expr.operator.toLowerCase();
                result = {
                    range: {
                        [this.visitFieldOrFail(expr.leftOperand)]: {
                            [op]: this.visitParameterOrFail(expr.rightOperand)
                        }
                    }
                };
                break;

            case OpIds.Ne:
                negate = true;
            case OpIds.In:
            case OpIds.Eq:
                result = {
                    terms: {
                        [this.visitFieldOrFail(expr.leftOperand)]: this.visitParameterForArray(expr.rightOperand)
                    }
                };
                break;

            case OpIds.Null:
                negate = true;
            case OpIds.NotNull:
                result = { exists: { field: this.visit(expr.leftOperand) } };
                break;

            case OpIds.Like:
                result = {
                    wildcard: { [this.visitFieldOrFail(expr.leftOperand)]: this.visitStringOrFail(expr.rightOperand) }
                };
                break;

            default:
                result = 'invalid';
                break;
        }

        return !negate
            ? result
            : {
                  bool: {
                      must_not: result
                  }
              };
    }
    private visitFieldOrFail(expr?: IExpression) {
        return expr instanceof NestedField ? this.visit(expr) : this.invalid();
    }
    public visitNestedField(expr: NestedField) {
        return expr.getFullName();
    }
    private visitParameterForArray(expr?: IExpression) {
        const result = this.visitParameterOrFail(expr);
        return result instanceof Array ? result : [result];
    }
    private visitStringOrFail(expr?: IExpression) {
        const result = this.visitParameterOrFail(expr);
        return typeof result === 'string' ? result : this.invalid();
    }
    private visitParameterOrFail(expr?: IExpression) {
        return expr instanceof Parameter ? this.visit(expr) : this.invalid();
    }
    public visitParameter(expr: Parameter) {
        return expr.value;
    }
    public visitOperation(expr: Operation) {
        switch (expr.name) {
            case 'filter':
                return { query: this.visit(expr.operands[0]) };
        }
        return {};
    }
    public visitRoot(expr?: IExpression) {
        return {
            query: this.visit(expr)
        };
    }
    public visitNull() {
        return null;
    }
    private invalid() {
        return '[Invalid]';
    }
}
