import * as React from 'react';
import { NestedField, TypeName } from '../../../src/Models/ExpressionModels';
import Axios from 'axios';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { TreeQuery, Query, Node } from './TreeQuery';
import VirtualList from './VirtualList';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { Section } from '../../Styles';

interface IFieldLoaderProps {
    onChange: (fields: NestedField[]) => void;
}

type FileInfo = { name: string; isDir: boolean; path: string; children?: FileInfo[] };

class FileService {
    private async get(path: string) {
        const response = await Axios.get(`http://localhost:1235/${path}`);
        return await response.data;
    }
    public async getTree() {
        return (await this.get('')) as FileInfo[];
    }
    public async getFile(filePath: string) {
        return await this.get(`file?path=${filePath}`);
    }
}

class ExpandableFile {
    @observable
    public expanded: boolean = false;

    constructor(public fileInfo: FileInfo) {}
}

const dim = {
    rowHeight: 25,
    pathWidth: 21
};

@observer
export class HrbFieldLoader extends React.Component<IFieldLoaderProps> {
    private svc = new FileService();
    private disposers: (() => void)[] = [];

    @observable
    private fileQuery?: Query<ExpandableFile>;

    @observable
    private containerHeight = 400;

    @observable
    private fileSelected?: ExpandableFile;

    private adjustHeight = () => {};

    private container = React.createRef<HTMLDivElement>();

    render() {
        return !this.fileQuery ? null : (
            <>
                <Section fill ref={this.container} style={{ overflow: 'hidden' }}>
                    <VirtualList height={this.containerHeight} itemCount={this.fileQuery.count()} itemSize={25}>
                        {(from: number, to: number) => this.renderTreeItems(from, to)}
                    </VirtualList>
                </Section>
            </>
        );
    }
    renderTreeItems(from: number, to: number) {
        let items = this.fileQuery!.skip(from).take(to);

        return items.toArray().map((node, i) => (
            <Name key={from + i}>
                <Path node={node} width={dim.pathWidth} height={dim.rowHeight} />
                <Value selected={this.fileSelected === node.item} onClick={() => this.handleItemClick(node.item)}>
                    {node.item.fileInfo.name}
                </Value>
            </Name>
        ));
    }
    componentDidMount() {
        this.handleSizing();
        this.loadRoot();
    }
    private handleItemClick(item: ExpandableFile) {
        if (item.fileInfo.isDir) {
            item.expanded = !item.expanded;
        } else {
            this.fileSelected = item;
            this.loadFile(item.fileInfo);
        }
    }
    private handleSizing() {
        let resizer = () => {
            if (this.container.current) {
                this.containerHeight = this.container.current.getBoundingClientRect().height;
            }
        };
        this.adjustHeight = resizer;
        window.addEventListener('resize', resizer);
        this.disposers.push(() => window.removeEventListener('resize', resizer));
    }
    private async loadRoot() {
        const files = await this.svc.getTree();
        this.fileQuery = new TreeQuery<ExpandableFile>(n => (n.fileInfo.children ? n.fileInfo.children.map(f => new ExpandableFile(f)) : undefined))
            .query(files.map(f => new ExpandableFile(f)))
            .provideNext((curr, fallback) => (fallback && !fallback.parent!.isRoot && !fallback.parent!.item.expanded ? fallback.ancestorForward() : fallback))
            .whereNode(n => n.parent!.item.expanded || n.parent!.isRoot);

        setTimeout(this.adjustHeight, 1);
    }
    private async loadFile(file: FileInfo) {
        if (!file.isDir) {
            const result = await this.svc.getFile(file.path);
            if ('Fields' in result) {
                this.props.onChange(result.Fields.map((f: any) => this.convertField(f)));
            }
        }
    }
    private convertField(field: { Name: string; Type: string }) {
        return new NestedField([field.Name], false, this.convertType(field.Type));
    }
    // ["USAmountNN", "USAmount", "String", "Integer", "SSN", "Checkbox", "Boolean", "BankAccount", "CapitalConstructionFundCd", "IntegerNN", "CombatZoneCd", "Date", "CreditFormsStatement8396Cd", "CreditFormsStatement8834Cd", "CreditFormsStatement8839Cd", "CreditFormsStatement8859Cd", "CreditFormsStatement8910Cd", "CreditFormsStatement8911Cd", "CreditFormsStatement8912Cd", "CreditFormsStatement8936Cd", "CreditFormsStatementSchRCd", "PhoneNumber", "BankAccountNumber", "DivorcedLiteralCd", "Id", "EICEligibilityLiteralCd", "ExcldSect933PuertoRicoIncmCd", "ExemptSETaxLiteralCd", "PersonNameControl", "PersonName", "FilingStatus", "ForeignEmployerPensionCd", "Form4684Cd", "Form8689Cd", "Form8814Cd", "IRADeductionCd", "IRSInstallmentOptions", "MaritalStatus", "ModifiedStandardDeductionInd", "ReturnExtensionReason", "NonPaidPreparerCd", "NRALiteralCd", "ForeignPhoneNumber", "OtherTaxAmtCd", "EIN", "BusinessNameLine1", "City", "StreetAddress", "State", "ZIPCode", "PTIN", "PersonFullName", "QualifyingPersonType", "RefundProductCd", "Text", "RepaymentCd", "RetirementTaxPlanLiteralCd", "RoutingTransitNumber", "ScheduleQCd", "SocSecBnftCd", "SoftwareVersion", "SpecialNeedsOrDCF", "SpecialProcessingLiteralCd", "PersonFirstName", "Decimal", "PIN", "WagesNotShownLitOnlyCd", "WithholdingCd"]
    private convertType(type: string) {
        switch (type) {
            case 'USAmountNN':
            case 'USAmount':
            case 'Integer':
            case 'IntegerNN':
            case 'Decimal':
                return TypeName.number;
            case 'Date':
                return TypeName.date;

            case 'Checkbox':
            case 'Boolean':
                return TypeName.boolean;
            default:
                return TypeName.string;
        }
    }
}

interface IPathProps {
    node: Node<ExpandableFile>;
    width: number;
    height: number;
}

class Path extends React.Component<IPathProps> {
    render() {
        const { width, height, node } = this.props;
        return (
            <>
                {[...node.ancestors()]
                    .reverse()
                    .filter(n => !n.isRoot)
                    .map(n => (
                        <PathItem key={n.rootIndex} hasNext={!!n.next} width={width} height={height} />
                    ))}
                <PathItem isChild isParent={node.hasChildren} width={width} height={height} hasNext={!!node.next} node={node.item} />
            </>
        );
    }
}
interface IPathItemProps {
    isChild?: boolean;
    isParent?: boolean;
    hasNext?: boolean;
    node?: { expanded: boolean };
    width: number;
    height: number;
}

class PathItem extends React.Component<IPathItemProps> {
    render() {
        const { width, height } = this.props;
        return (
            <a href="javascript:" onClick={this.handleClick}>
                <svg width={width} height={height} stroke="#0009" fill="none">
                    {this.renderLinePath()}
                    {this.props.isParent && this.props.isChild ? this.renderExpanderPath() : null}
                </svg>
            </a>
        );
    }
    renderLinePath() {
        const { width, height, isChild, isParent, hasNext } = this.props,
            hw = width / 2,
            hh = height / 2,
            ex = this.getExpanderSize() / 2;
        let data = '';

        if (!isChild) {
            if (hasNext) {
                data += `M${hw},${0} L${hw},${height}`;
            }
        } else {
            if (!isParent) {
                data += `M${hw},${0} L${hw},${hh} L${width},${hh}`;
                if (hasNext) {
                    data += ` M${hw},${hh} L${hw},${height}`;
                }
            } else {
                data += `M${hw},${0} L${hw},${hh - ex} M${hw + ex},${hh} L${width},${hh}`;
                if (hasNext) {
                    data += `M${hw},${hh + ex} L${hw},${height}`;
                }
            }
        }

        return <path d={data} />;
    }
    renderExpanderPath() {
        const { node, width, height } = this.props,
            hw = width / 2,
            hh = height / 2,
            ex = this.getExpanderSize() / 2,
            exh = ex - 1.5;
        let data = `M${hw - ex},${hh - ex}
            L${hw + ex},${hh - ex}
            L${hw + ex},${hh + ex}
            L${hw - ex},${hh + ex}
            L${hw - ex},${hh - ex}`;

        data += ` M${hw - exh},${hh} L${hw + exh},${hh}`;
        if (!node!.expanded) {
            data += ` M${hw},${hh - exh} L${hw},${hh + exh}`;
        }

        return <path d={data} />;
    }
    private getExpanderSize() {
        return this.props.height * 0.4;
    }
    private handleClick = () => {
        if (this.props.node) {
            this.props.node.expanded = !this.props.node.expanded;
        }
    };
}

const Name = styled.div`
    display: flex;
    padding-left: 15px;
`;
const Value = styled(Typography)<{ selected: boolean }>`
    line-height: ${dim.rowHeight}px !important;
    white-space: nowrap;
    cursor: pointer;
    background: ${p => (p.selected ? '#4a90e2' : 'none')};
    color: ${p => (p.selected ? '#fff' : undefined)};
    flex: 1 1 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0 5px;
`;
