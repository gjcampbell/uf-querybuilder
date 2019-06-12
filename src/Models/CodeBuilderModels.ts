import { observable } from 'mobx';
import {
    exprTypeNames,
    IExpression,
    OpIds,
    Criterion,
    TypeName,
    CriteriaGroup,
    NestedField,
    Parameter,
    IfOperation,
    Operation,
    ChooseOperation
} from './ExpressionModels';
import { IExprEditorFactory } from './EditorInterfaces';
import defaultExprEditorFactory from '../Components/DefaultExprEditorFactory';

export class DataSource {
    @observable
    public fields: NestedField[];
    constructor(fields: NestedField[]) {
        this.fields = fields;
    }
}

export class UfOperator {
    public ufName: string;
    constructor(public id: OpIds, userFriendlyName: string) {
        this.id = id;
        this.ufName = userFriendlyName || id;
    }
}

export type ExprConstructor = new (...args: any[]) => IExpression;
type TypedExprConstructor<T> = new (...args: any[]) => T;
export class UfExpression {
    public ufName: string;
    constructor(public type: ExprConstructor, userFriendlyName: string) {
        this.ufName = userFriendlyName;
    }
}

export const defaultExprTypes = [
    new UfExpression(Criterion, 'Rule'),
    new UfExpression(CriteriaGroup, 'Group'),
    new UfExpression(NestedField, 'Field Data'),
    new UfExpression(Parameter, 'Static Value'),
    new UfExpression(IfOperation, 'If, Then, Else')
].reduce((result, item) => {
    result.set(item.type, item);
    return result;
}, new Map<ExprConstructor, UfExpression>());

const defaultTypeOperators = {
    [TypeName.boolean]: [
        new UfOperator(OpIds.Eq, 'is equal to'),
        new UfOperator(OpIds.Ne, 'is not equal to'),
        new UfOperator(OpIds.NotNull, 'is set'),
        new UfOperator(OpIds.Null, 'is not set')
    ],
    [TypeName.array]: [
        new UfOperator(OpIds.HasAll, 'all are like'),
        new UfOperator(OpIds.HasAny, 'some are like'),
        new UfOperator(OpIds.HasNone, 'none are like'),
        new UfOperator(OpIds.NotNull, 'is set'),
        new UfOperator(OpIds.Null, 'is not set')
    ],
    [TypeName.object]: [new UfOperator(OpIds.NotNull, 'is set'), new UfOperator(OpIds.Null, 'is not set')],
    [TypeName.date]: [
        new UfOperator(OpIds.Eq, 'is on'),
        new UfOperator(OpIds.Ne, 'is not on'),
        new UfOperator(OpIds.Gt, 'is after'),
        new UfOperator(OpIds.Gte, 'is on or after'),
        new UfOperator(OpIds.Lt, 'is before'),
        new UfOperator(OpIds.Lte, 'is on or before'),
        new UfOperator(OpIds.In, 'is any of'),
        new UfOperator(OpIds.NotNull, 'is set'),
        new UfOperator(OpIds.Null, 'is not set')
    ],
    [TypeName.string]: [
        new UfOperator(OpIds.In, 'is any of'),
        new UfOperator(OpIds.Eq, 'is same as'),
        new UfOperator(OpIds.Ne, 'is not same as'),
        new UfOperator(OpIds.Like, 'contains text'),
        new UfOperator(OpIds.Gt, 'is alphabetically after'),
        new UfOperator(OpIds.Gte, 'is same or alphabetically after'),
        new UfOperator(OpIds.Lt, 'is alphabetically before'),
        new UfOperator(OpIds.Lte, 'is same or alphabetically before'),
        new UfOperator(OpIds.NotNull, 'is set'),
        new UfOperator(OpIds.Null, 'is not set')
    ],
    [TypeName.number]: [
        new UfOperator(OpIds.Eq, 'is same as'),
        new UfOperator(OpIds.Ne, 'is not same as'),
        new UfOperator(OpIds.Gt, 'is greater than'),
        new UfOperator(OpIds.Gte, 'is equal or greater than'),
        new UfOperator(OpIds.Lt, 'is less than'),
        new UfOperator(OpIds.Lte, 'is equal or less than'),
        new UfOperator(OpIds.In, 'is any of'),
        new UfOperator(OpIds.NotNull, 'is set'),
        new UfOperator(OpIds.Null, 'is not set')
    ],
    [TypeName.null]: []
} as { [t: number]: UfOperator[] };
const typeNames = [TypeName.null, TypeName.boolean, TypeName.array, TypeName.object, TypeName.date, TypeName.string, TypeName.number];
export const defaultTypeOperatorProvider = (type: TypeName) => {
    const result: UfOperator[] = [];
    for (let typeName of typeNames) {
        const t = typeName & type;
        if (defaultTypeOperators[t]) {
            for (let op of defaultTypeOperators[t]) {
                if (!result.find(o => o.ufName === op.ufName)) {
                    result.push(op);
                }
            }
        }
    }

    return result;
};

export interface IExprOption {
    name: string;
    ufName?: string;
    description?: string;
    knownType?: boolean;
    createExpr: () => IExpression;
}

export interface IOperationParam {
    name?: string;
    editorType?: React.ComponentType<{ update: (expr?: IExpression) => void; remove: () => void; model: IExpression }>;
    description?: string;
    type?: TypeName;
}

export interface IOperationConfig {
    name: string;
    ufName?: string;
    description?: string;
    parameters: IOperationParam[];
    returnType: TypeName;
    defaultOperands?: () => (IExpression | ExprConstructor)[];
    layoutVertically?: boolean;
}

export interface ICodeBuilderConfig {
    dataSource: DataSource;
    getTypeOperators: (type: TypeName) => UfOperator[];
    exprTypes: Map<ExprConstructor, UfExpression>;
    createDefaultExpr?: (type: ExprConstructor, parent?: IExpression, config?: IOperationConfig) => IExpression | undefined | null;
    operations: IOperationConfig[];
    getExprOptions?: (parent: IExpression | undefined, type?: TypeName, param?: IOperationParam) => IExprOption[] | undefined | null;
    viewOnly?: boolean;
    editorFactory: IExprEditorFactory;
    onChange?: (expr?: IExpression) => void;
}

const knownExprTypes = [NestedField, Parameter, IfOperation, ChooseOperation, Criterion, CriteriaGroup];

const sortFields = (fields: NestedField[]) => {
    return fields.slice().sort((a, b) => {
        const aName = a.getFullName(),
            bName = b.getFullName();
        return aName > bName ? 1 : aName < bName ? -1 : 0;
    });
};
const createFieldTree = (fields: NestedField[]) => {
    const result: FieldTreeNode[] = [];
    let curr = undefined;

    for (let i = 0; i < fields.length; i++) {
        let node = new FieldTreeNode(fields[i]);
        if (!curr) {
            result.push((curr = node));
        } else {
            const parent = curr.findParent(node);
            if (parent) {
                node.parent = parent;
                parent.children.push((curr = node));
            } else {
                result.push((curr = node));
            }
        }
    }

    return result;
};
export const createSortedFieldTree = (fields: NestedField[]) => {
    const sortedFields = sortFields(fields),
        result = createFieldTree(sortedFields);

    return result;
};

export class FieldTreeNode {
    public children: FieldTreeNode[] = [];
    public fullName: string;
    public name: string;
    public type: TypeName;
    constructor(public field: NestedField, public parent?: FieldTreeNode) {
        this.fullName = field.getFullName();
        this.name = field.getName();
        this.type = field.type;
    }
    public findParent(item: FieldTreeNode): FieldTreeNode | null {
        return item.fullName.startsWith(this.fullName + '.') ? this : this.parent ? this.parent.findParent(item) : null;
    }
}

export const defaultBuilderConfig = Object.freeze({
    getTypeOperators: defaultTypeOperatorProvider,
    exprTypes: defaultExprTypes
} as Partial<ICodeBuilderConfig>);

export class CodeBuilder {
    @observable
    public code?: IExpression;

    @observable
    public config: ICodeBuilderConfig;

    public get editorFactory() {
        return this.config.editorFactory!;
    }

    private fields: FieldTreeNode[] | null = null;
    private nestedFields: NestedField[] = [];

    constructor(config: Partial<ICodeBuilderConfig>) {
        config = config || {};
        if (!config.dataSource) throw `You must provide a datasource, dude`;
        this.config = {
            dataSource: config.dataSource,
            getTypeOperators: config.getTypeOperators || defaultTypeOperatorProvider,
            exprTypes: config.exprTypes || defaultExprTypes,
            createDefaultExpr: config.createDefaultExpr,
            operations: config.operations || [],
            viewOnly: config.viewOnly || false,
            editorFactory: config.editorFactory || defaultExprEditorFactory,
            onChange: config.onChange,
            getExprOptions: config.getExprOptions
        };
        this.nestedFields = config.dataSource.fields;
    }

    public getUfOperator(criterion: Criterion) {
        let result = undefined;

        const availableOps = this.getUfOperators(criterion);
        if (availableOps.length) {
            result = availableOps.find(o => o.id === criterion.operator);
        }

        return result;
    }

    public getUfOperators(criterion: Criterion): UfOperator[] {
        let result = this.config.getTypeOperators(TypeName.object);

        const leftType = this.getExprValueType(criterion.leftOperand),
            rightType = this.getExprValueType(criterion.rightOperand);

        if (leftType) {
            result = this.config.getTypeOperators(leftType);
        } else if (rightType) {
            result = this.config.getTypeOperators(rightType);
        }
        return result;
    }

    public getExprValueType(expr?: IExpression): TypeName | null {
        if (expr && expr.getValueType) {
            return expr.getValueType();
        } else if (expr instanceof Operation) {
            const config = this.getOperationConfig(expr.name);
            return config ? config.returnType : null;
        } else {
            return null;
        }
    }

    public createDefaultExpr<T>(type: TypedExprConstructor<T>, parent?: IExpression, config?: IOperationConfig): T | null {
        let result = this.config.createDefaultExpr ? this.config.createDefaultExpr(type, parent, config) : undefined;

        if (result === undefined) {
            result = new type();
        }

        return result as T;
    }

    public getExprOptions(parent: IExpression | undefined, type?: TypeName, param?: IOperationParam): IExprOption[] {
        type = type || TypeName.any;
        let options: IExprOption[] | undefined | null = this.config.getExprOptions ? this.config.getExprOptions(parent, type, param) : undefined;

        if (options === undefined) {
            return this.getDefaultExprOptions(parent, type, param);
        } else if (options === null) {
            return [];
        } else {
            return options!;
        }
    }

    public getDefaultExprOptions(parent: IExpression | undefined, type?: TypeName, param?: IOperationParam) {
        type = type || TypeName.any;
        const result = this.getOperationOptions(parent, type);

        [...exprTypeNames.keys()]
            .filter(t => (exprTypeNames.get(t)!.type & type!) === type || exprTypeNames.get(t)!.type === TypeName.any)
            .forEach(t => {
                const option = this.getOptionForKnownExpr(t as ExprConstructor, parent);
                if (option) {
                    result.unshift(option);
                }
            });

        return result;
    }

    private getOperationOptions(parent: IExpression | undefined, type: TypeName): IExprOption[] {
        return this.config.operations
            .filter(o => (o.returnType & type) === type || o.returnType === TypeName.any)
            .map(o => this.createOperationOption(o, parent));
    }

    public createOperationOption(op: IOperationConfig, parent?: IExpression) {
        return {
            name: op.name,
            ufName: op.ufName,
            description: op.description,
            createExpr: () => this.createOperation(op, parent)
        } as IExprOption;
    }

    private getOptionForKnownExpr(expr: ExprConstructor, parent: IExpression | undefined): IExprOption | null {
        if (expr === Criterion) return { name: 'Rule', knownType: true, createExpr: () => this.createDefaultExpr(Criterion, parent)! };
        if (expr === CriteriaGroup) return { name: 'Rule Group', knownType: true, createExpr: () => this.createDefaultExpr(CriteriaGroup, parent)! };
        if (expr === IfOperation) return { name: 'If-then-else', knownType: true, createExpr: () => this.createDefaultExpr(IfOperation, parent)! };
        if (expr === NestedField) return { name: 'Field Value', knownType: true, createExpr: () => this.createDefaultExpr(NestedField, parent)! };
        if (expr === Parameter) return { name: 'Static Value', knownType: true, createExpr: () => this.createDefaultExpr(Parameter, parent)! };
        if (expr === ChooseOperation) return { name: 'Choose', knownType: true, createExpr: () => this.createDefaultExpr(ChooseOperation, parent)! };
        return null;
    }

    public createOperation(config: IOperationConfig, parent?: IExpression) {
        const result = this.createDefaultExpr(Operation, parent, config);
        if (result === null)
            throw `Just create the thing. You returned null when asked for a default Operation. That means you don't want one created. Did you know that? Just return undefined instead. `;
        result.name = config.name;
        if (config.defaultOperands) {
            const defaults = config.defaultOperands().map(o => (typeof o === 'function' ? this.createDefaultExpr(o, result) : o));
            result.operands = defaults;
        }

        return result;
    }

    public getOperationConfig(operationName: string) {
        const lowerOpName = operationName.toLowerCase();
        return this.config.operations.find(o => o.name.toLowerCase() === lowerOpName);
    }

    public getNestedFields(): NestedField[] {
        return this.nestedFields;
    }
    public getFields(): FieldTreeNode[] {
        return this.fields || (this.fields = createSortedFieldTree(this.config.dataSource.fields));
    }
    public setFields(fields: NestedField[]) {
        this.nestedFields = fields;
        this.fields = createSortedFieldTree(fields);
    }
    public viewOnly() {
        return !!this.config.viewOnly;
    }

    public raiseChange(model?: IExpression | null) {
        if (this.config.onChange) {
            this.config.onChange(model ? model : undefined);
        }
    }
}
