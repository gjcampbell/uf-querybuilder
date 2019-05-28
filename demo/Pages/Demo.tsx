import * as React from 'react';
import FieldLoader, { YelpFieldLoader } from './Demo/FieldLoader';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import { NestedField, IExpression } from '../../src/Models/ExpressionModels';
import QueryBuilder from './Demo/QueryBuilder';
import ElasticQuery from './Demo/ElasticQuery';
import { GridResultViewer } from './Demo/ResultViewer';
import { PanelContainer, Panel, Section } from '../Styles';
import { Typography } from '@material-ui/core';

@observer
export default class Demo extends React.Component {
    @observable
    private fields: NestedField[] = [];

    @observable
    private expr: { query?: IExpression } = {};

    render() {
        return (
            <PanelContainer>
                <Panel width="sm">
                    <Section pad>Demo</Section>
                </Panel>
                <YelpFieldLoader onChange={fields => (this.fields = fields)} />
                <Panel width="md">
                    <QueryBuilder fields={this.fields} onChange={expr => (this.expr = expr)} />
                    <Section pad>
                        <Typography>Elastic Query</Typography>
                    </Section>
                    <Section pad style={{ maxHeight: '300px' }}>
                        <ElasticQuery expr={this.expr} />
                    </Section>
                </Panel>
                <Panel width="lg">
                    <GridResultViewer expr={this.expr} index="yelp" />
                </Panel>
            </PanelContainer>
        );
    }
}
