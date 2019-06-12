import * as React from 'react';
import TextField from '@material-ui/core/TextField';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import { NestedField, TypeName } from '../../../src/Models/ExpressionModels';
import { EsService } from './Services';

interface IFieldLoaderProps {
    onChange: (fields: NestedField[]) => void;
}

@observer
export default class FieldLoader extends React.Component<IFieldLoaderProps> {
    @observable
    private text: string = '';

    render() {
        return (
            <TextField
                fullWidth
                value={this.text}
                onChange={e => this.handleTextChange(e.target.value)}
                multiline
                rowsMax={15}
                variant="filled"
                label="Sample JSON Data"
                helperText="This will be used to create a schema and determine what fields should be available in the query builder. "
            />
        );
    }

    private handleTextChange(text: string) {
        this.text = text;
        this.parseFields();
    }

    private parseFields() {
        try {
            const data = JSON.parse(this.text),
                fieldMap = new Map<string, NestedField>();

            toNestedFields(data instanceof Array ? data : [data], [], fieldMap);

            this.props.onChange([...fieldMap.values()]);
        } catch (e) {
            console.log(`Invalid json`, e);
        }
    }
}

const toNestedFields = (sampleData: any[], path: string[], result: Map<string, NestedField>): void => {
    for (let i = 0; i < sampleData.length; i++) {
        let item = sampleData[i];
        if (item instanceof Array) {
            toNestedFields(item, path, result);
        } else if (typeof item === 'object' && !(item instanceof Date)) {
            const fields = Object.keys(item);
            fields.forEach(f => {
                const currentPath = [...path, f],
                    value = item[f],
                    type = getTypeNameForValue(value),
                    field = new NestedField(currentPath, false, type),
                    existingField = result.get(field.getFullName());

                if (existingField) {
                    existingField.type = mergeTypes(field.type, existingField.type);
                } else {
                    result.set(field.getFullName(), field);
                }

                if (type === TypeName.object || type === TypeName.array) {
                    toNestedFields(value instanceof Array ? value : [value], currentPath, result);
                }
            });
        }
    }
};

const mergeTypes = (a: TypeName, b: TypeName) => {
    if (a === b) return a;
    if (a === TypeName.null) return b;
    if (b === TypeName.null) return a;
    return a | b;
};

const getTypeNameForValue = (value: any): TypeName => {
    const typeOfValue = typeof value;
    if (typeOfValue === 'bigint' || typeOfValue === 'number') return TypeName.number;
    if (typeOfValue === 'boolean') return TypeName.boolean;
    if (typeOfValue === 'string') return TypeName.string;
    if (value instanceof Date) return TypeName.date;
    if (value instanceof Array) {
        const first = value.find(() => true);
        if (first) {
            const itemType = getTypeNameForValue(first);
            if (itemType === TypeName.object) return TypeName.array;
            return itemType;
        } else {
            return TypeName.null;
        }
    }
    if (value === null) return TypeName.null;
    if (typeOfValue === 'object') return TypeName.object;
    return TypeName.null;
};

export class YelpFieldLoader extends React.Component<IFieldLoaderProps> {
    private svc = new EsService();
    render() {
        return <></>;
    }
    componentDidMount() {
        this.load();
    }
    private async load() {
        const sampleData = await this.svc.search<any>('yelp', { size: 50 });
        const fieldMap = new Map<string, NestedField>();

        toNestedFields(sampleData.items, [], fieldMap);
        this.props.onChange([...fieldMap.values()]);
    }
}
