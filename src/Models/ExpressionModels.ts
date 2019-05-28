import { observable, computed } from 'mobx';
export const exprTypes = new Map<string, { ctor: new () => IExpression; condition?: (expr: any) => boolean }[]>();
export const exprTypeNames = new Map<Function, { name: string; type: TypeName }>();

export enum TypeName {
    any = 0,
    null = 1,
    boolean = 1 << 1,
    array = 1 << 2,
    object = 1 << 3,
    date = 1 << 4,
    string = 1 << 5,
    number = 1 << 6
}

export enum OpIds {
    Eq = 'Eq',
    Ne = 'Ne',
    Gt = 'Gt',
    Gte = 'Gte',
    Lt = 'Lt',
    Lte = 'Lte',
    In = 'In',
    Like = 'Like',
    HasAny = 'HasAny',
    HasAll = 'HasAll',
    HasNone = 'HasNone',
    Null = 'Null',
    NotNull = 'NotNull'
}

export class ExpressionRoot {
    @observable
    public root?: IExpression;
}

export interface IExpression {
    [field: string]: any;
    getValueType?: () => TypeName;
}

export interface ICustomSerialization {
    toJson(): {};
}

export interface IConditionalExpression extends IExpression {}

type Connector = 'and' | 'or';

@Expr('Empty', undefined, TypeName.null)
export class Empty implements IExpression {
    public static instance: Empty = new Empty();
}

@Expr('CriteriaGroup', undefined, TypeName.boolean)
export class CriteriaGroup implements IConditionalExpression {
    @observable
    public criteria: IExpression[] = [];
    @observable
    public connector: Connector = 'and';
    @observable
    public negate: boolean = false;

    public addSubGroup(group: CriteriaGroup) {
        this.criteria.push(group);
    }

    public addCriterion(crit: Criterion) {
        this.criteria.push(crit);
    }
    public add(child: IConditionalExpression) {
        this.criteria.push(child);
    }

    public remove(item: IConditionalExpression) {
        const idx = this.criteria.indexOf(item);
        if (idx >= 0) {
            this.criteria.splice(idx, 1);
        }
    }

    public getValueType() {
        return TypeName.boolean;
    }
}

@Expr('Criterion', undefined, TypeName.boolean)
export class Criterion implements IConditionalExpression {
    @observable
    public leftOperand?: IExpression;
    @observable
    public operator?: OpIds;
    @observable
    public rightOperand?: IExpression;
    constructor(leftOp: IExpression, operator: OpIds, rightOp: IExpression) {
        this.leftOperand = leftOp;
        this.operator = operator;
        this.rightOperand = rightOp;
    }

    public getValueType() {
        return TypeName.boolean;
    }
}

@Expr('NestedField')
export class NestedField implements IExpression {
    @observable
    public path: string[];
    @observable
    public scoped: boolean;
    public type: TypeName;

    constructor(fieldPath: string[], scoped?: boolean, type?: TypeName) {
        this.path = fieldPath || [];
        this.scoped = !!scoped;
        this.type = type || TypeName.string;
    }
    public getName() {
        return this.path.length ? this.path[this.path.length - 1] : 'None';
    }
    public getFullName() {
        return this.path.join('.');
    }
    public isUnder(path: string[]) {
        return (this.getFullName() + '.').indexOf(path.join('.')) === 0;
    }
    public tryScope(to: string[]) {
        const canScope = this.isUnder(to),
            path = canScope ? this.path.slice(to.length) : null;

        return path === null ? null : new NestedField(path, true, this.type);
    }
    public copy(): NestedField {
        return new NestedField(this.path.slice(), this.scoped, this.type);
    }
    public getValueType() {
        return this.type;
    }
}

@Expr('Parameter')
export class Parameter implements IExpression {
    @observable
    public value: object;
    @observable
    public type: TypeName;
    constructor(value: any, type: TypeName = TypeName.string) {
        this.value = value || '';
        this.type = type;
    }
    public getValueType() {
        return this.type;
    }
}

@Expr('Operation')
export class Operation implements IExpression {
    @observable
    public name: string;
    @observable
    public operands: any[];
    constructor(name: string, operands: any[]) {
        this.name = name || '';
        this.operands = operands || [];
    }
    public setOperand(i: number, expr?: IExpression) {
        if (this.operands.length <= i) {
            for (let ii = 0; ii < i + 1; ii++) {
                if (!this.operands[ii]) {
                    this.operands[ii] = null;
                }
            }
        }
        this.operands[i] = expr;
    }
}

@Expr('Operation', e => e.name.toLowerCase() === 'if')
export class IfOperation extends Operation {
    @computed
    public get condition() {
        return this.operands.length > 0 ? this.operands[0] : null;
    }
    public set condition(value: IConditionalExpression | undefined) {
        this.setOperand(0, value);
    }
    @computed
    public get ifTrue() {
        return this.operands.length > 1 ? this.operands[1] : null;
    }
    public set ifTrue(value: IExpression | undefined) {
        this.setOperand(1, value);
    }
    @computed
    public get ifFalse() {
        return this.operands.length > 2 ? this.operands[2] : null;
    }
    public set ifFalse(value: IExpression | undefined) {
        this.setOperand(2, value);
    }

    constructor() {
        super('if', []);
    }
}

@Expr('Operation', e => e.name.toLowerCase() === 'choose')
export class ChooseOperation extends Operation {
    constructor() {
        super('choose', []);
    }
}

export abstract class VisitorBase<T> {
    public visit(expr?: IExpression): T {
        if (expr instanceof Empty) return this.visitEmpty(expr);
        if (expr instanceof CriteriaGroup) return this.visitCriteriaGroup(expr);
        if (expr instanceof Criterion) return this.visitCriterion(expr);
        if (expr instanceof NestedField) return this.visitNestedField(expr);
        if (expr instanceof Parameter) return this.visitParameter(expr);
        if (expr instanceof Operation) return this.visitOperation(expr);
        if (expr === null || expr === undefined) return this.visitNull();
        console.error('Attempted to visit invalid type. ', expr);
        throw `I don't know how to visit this... "${expr && expr.constructor.name}"`;
    }
    public abstract visitEmpty(expr: Empty): T;
    public abstract visitCriteriaGroup(expr: CriteriaGroup): T;
    public abstract visitCriterion(expr: Criterion): T;
    public abstract visitNestedField(expr: NestedField): T;
    public abstract visitParameter(expr: Parameter): T;
    public abstract visitOperation(expr: Operation): T;
    public abstract visitNull(): T;
}

function Expr(name?: string, condition?: (expr: any) => boolean, type?: TypeName) {
    return (ctor: new (...args: any[]) => IExpression) => {
        name = name || ctor.name;
        type = type || TypeName.any;
        const typeEntry = { ctor, condition },
            nameEntry = { name, type };

        exprTypeNames.set(ctor, nameEntry);

        if (!exprTypes.has(name)) {
            exprTypes.set(name, []);
        }
        exprTypes.get(name)!.unshift(typeEntry);
    };
}

export const copyExpr = (expr: IExpression) => {
    const exprJson = Serializer.toJson(expr),
        result = Serializer.fromJson(exprJson);
    return result;
};

export class Serializer {
    static toJson(expr: IExpression) {
        let result = expr;

        if (expr instanceof Array) {
            result = expr.map(Serializer.toJson);
        } else if (expr && typeof expr === 'object' && expr.constructor && exprTypeNames.has(expr.constructor)) {
            result = { $type: exprTypeNames.get(expr.constructor)!.name };

            if ('toJson' in expr) {
                result = (<ICustomSerialization>expr).toJson();
            } else {
                Object.keys(expr).forEach(k => {
                    const value = expr[k];
                    if (typeof value !== 'function') {
                        result[k] = Serializer.toJson(value);
                    }
                });
            }
        }

        return result;
    }
    static fromJson(exprJson: any) {
        let result = exprJson;

        if (exprJson instanceof Array) {
            result = exprJson.map(Serializer.fromJson);
        } else if (exprJson && exprJson.$type && exprTypes.has(exprJson.$type)) {
            const ExprTypes = exprTypes.get(exprJson.$type),
                BestType = ExprTypes!.find(t => !!t.condition && t.condition(exprJson)) || ExprTypes!.find(t => !t.condition);

            result = new BestType!.ctor();

            Object.keys(exprJson).forEach(k => {
                if (k !== '$type') {
                    const value = exprJson[k];
                    result[k] = Serializer.fromJson(value);
                }
            });
        }

        return result;
    }
}
