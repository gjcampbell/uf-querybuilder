import * as React from 'react';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { EsService } from './Services';
import { IExpression } from '../../../src/Models/ExpressionModels';
import ExprVisitorElastic from './ExprVisitorElastic';
import { Typography, Table, TableHead, TableRow, TableCell, TableBody, Tooltip } from '@material-ui/core';
import { Section } from '../../Styles';

interface IResultsViewerProps {
    expr: { query?: IExpression };
    index: string;
}

@observer
export class GridResultViewer extends React.Component<IResultsViewerProps> {
    private svc = new EsService();
    private visitor = new ExprVisitorElastic();

    @observable
    private results: { items: any[]; total: number } = { items: [], total: 0 };

    @observable
    private loading = false;

    render() {
        return (
            <>
                <Section pad>
                    <Typography variant="h5">Results</Typography>
                </Section>
                {!this.props.expr.query ? this.renderEmpty() : this.loading ? this.renderLoading() : this.renderGrid()}
            </>
        );
    }
    renderEmpty() {
        return (
            <Section fill pad>
                <Typography>No Filters</Typography>
            </Section>
        );
    }
    renderLoading() {
        return (
            <Section fill pad>
                <Typography>
                    <i className="fa fa-sync fa-spin" /> Loading
                </Typography>
            </Section>
        );
    }
    renderGrid() {
        return (
            <>
                <Section fill>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell align="center">Rating</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Categories</TableCell>
                                <TableCell>Address</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {this.results.items.map((d, i) => (
                                <TableRow key={i}>
                                    <TableCell align="center">
                                        <Tooltip title={`${d.stars} out of 5 from ${d.review_count} Reviews`}>
                                            <span style={{ whiteSpace: 'nowrap' }}>
                                                {[...Array(Math.floor(d.stars))].map((n, i) => (
                                                    <i key={i} className="fa fa-star" />
                                                ))}
                                                {d.stars % 1 !== 0 ? <i className="fa fa-star-half" /> : null}
                                                {d.stars === 0 ? '0 stars' : null}
                                            </span>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>{d.name}</TableCell>
                                    <TableCell>{d.categories}</TableCell>
                                    <TableCell>
                                        <address>
                                            {d.address}
                                            <br />
                                            {d.city} {d.state} {d.postal_code}
                                        </address>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Section>
                <Section pad>
                    <Typography align="right">
                        Showing {this.results.items.length} out of {this.results.total}
                    </Typography>
                </Section>
            </>
        );
    }

    componentDidUpdate(prevProps: IResultsViewerProps) {
        if (prevProps.expr !== this.props.expr || prevProps.index !== this.props.index) {
            this.load();
        }
    }
    componentDidMount() {
        this.load();
    }

    private async load() {
        const searchBody = this.visitor.visitRoot(this.props.expr.query);
        if (searchBody.query) {
            this.loading = true;
            try {
                const results = await this.svc.search<any>(this.props.index, searchBody);
                this.results = results;
            } finally {
                this.loading = false;
            }
        }
    }
}
