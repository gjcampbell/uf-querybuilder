import * as React from 'react';
import { observable, computed } from 'mobx';
import { observer } from 'mobx-react';
import TextField from '@material-ui/core/TextField/TextField';
import styled from 'styled-components';
import { CSSProperties } from 'react';
import InputAdornment from '@material-ui/core/InputAdornment';
import { AutoSizer, Grid } from 'react-virtualized';

interface ITreeOptions {
    nodeRenderer?: (item: any, model: ExpandableItem, node: TreeNode<ExpandableItem>, highlight: boolean) => React.ReactNode;
    textAccessor: (item: any) => string;
    childrenAccessor: (item: any) => any[];
    onNodeClick?: (item: any) => void;
    onQueryCreated?: (query: Query<ExpandableItem>) => void;
}

interface ITreeProps extends ITreeOptions {
    items: any[];
    filter?: string;
    height?: 'fill' | number;
    itemHeight?: number;
    containerStyle?: React.CSSProperties;
    itemComponent?: React.ComponentType<{ style: CSSProperties; node: TreeNode<ExpandableItem> }>;
    itemContainerStyle?: (item: any) => React.CSSProperties | undefined;
    noHierarchy?: boolean;
    onScroll?: (top: number, left: number) => void;
    width?: number;
    highlightedIndex?: number;
}

enum Dir {
    UP = 38,
    DOWN = 40,
    IN = 39,
    OUT = 41
}
const ENTER = 13;

interface IFilterableTreeProps extends ITreeProps {
    filterLabel: string;
    filterHelpText?: string;
    focus?: boolean;
    scrollPanelStyle?: CSSProperties;
    emptyText?: React.ReactNode;
    onFilterChange?: (filterText: string) => void;
}

@observer
export class FilterableTree extends React.Component<IFilterableTreeProps> {
    @observable
    private query?: Query<ExpandableItem>;
    @observable
    private filter = '';
    @observable
    private highlighted?: number;

    render() {
        const hasNodes = this.anyNodes();
        return (
            <div onKeyDown={this.handleKeyDown} onKeyPress={this.handleKeyPress}>
                <TextField
                    onChange={this.handleFilterChange}
                    fullWidth
                    autoFocus={this.props.focus}
                    label={this.props.filterLabel}
                    value={this.filter}
                    helperText={this.props.filterHelpText}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <i className="fa fa-filter" />
                            </InputAdornment>
                        )
                    }}
                />
                <ScrollArea style={this.props.scrollPanelStyle}>
                    <Tree onQueryCreated={this.handleRootCreated} {...this.props} highlightedIndex={this.highlighted} filter={this.filter} />
                    {hasNodes ? null : this.props.emptyText}
                </ScrollArea>
            </div>
        );
    }
    anyNodes() {
        return this.query && [...this.query.take(1)].length;
    }
    navigate(dir: Dir) {
        if (this.highlighted !== undefined && this.query) {
            if (dir === Dir.IN || dir === Dir.OUT) {
                const current = this.query.nth(this.highlighted);
                if (current) {
                    if (dir === Dir.OUT) {
                        if (current.item.expanded) {
                            current.item.expanded = false;
                        } else {
                            dir = Dir.UP;
                        }
                    } else if (dir === Dir.IN) {
                        if (!current.item.expanded) {
                            current.item.expanded = true;
                        } else {
                            dir = Dir.DOWN;
                        }
                    }
                }
            }

            if (dir === Dir.UP) {
                const next = !this.highlighted ? this.query.count() - 1 : this.highlighted - 1;
                this.highlighted = next;
            } else if (dir === Dir.DOWN) {
                this.highlighted = this.query.nth(this.highlighted + 1) ? this.highlighted + 1 : 0;
            }
        } else if (this.query) {
            const item = this.query.nth(0);
            this.highlighted = item ? 0 : undefined;
        }
    }
    private handleFilterChange = (e: { target: { value: string } }) => {
        this.highlighted = undefined;
        this.filter = e.target.value;
        if (this.props.onFilterChange) {
            this.props.onFilterChange(this.filter);
        }
    };
    private handleRootCreated = (query: Query<ExpandableItem>) => {
        this.query = query;
        if (this.props.onQueryCreated) {
            this.props.onQueryCreated(query);
        }
    };
    private handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.which === ENTER && this.props.onNodeClick && this.query && this.highlighted !== undefined) {
            const node = this.query.nth(this.highlighted);
            if (node) {
                this.props.onNodeClick(node.item.data);
            }
        }
    };
    private handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const dir =
            e.ctrlKey && e.which === Dir.UP
                ? Dir.OUT
                : e.ctrlKey && e.which === Dir.DOWN
                ? Dir.IN
                : e.which === Dir.UP
                ? Dir.UP
                : e.which === Dir.DOWN
                ? Dir.DOWN
                : undefined;
        if (dir) {
            this.navigate(dir);
        }
    };
}

class ExpandableItem {
    public get text() {
        return this.textAccessor();
    }

    @observable
    public expanded: boolean = false;
    constructor(public data: any, private textAccessor: () => string) {}
}

@observer
export default class Tree extends React.Component<ITreeProps> {
    @observable
    private query?: Query<ExpandableItem>;
    @observable
    private filter?: RegExp;
    private treeQuery?: TreeQuery<ExpandableItem>;
    private disposers: (() => void)[] = [];
    private containerRef = React.createRef<HTMLDivElement>();

    render() {
        return this.query ? this.renderItems() : null;
    }
    renderItems() {
        const items = this.query!.toArray(),
            fill = typeof this.props.height !== 'number',
            itemHeight = this.getItemHeight(),
            maxHeight = fill ? 0 : Math.min(items.length * itemHeight, this.props.height as number),
            ItemComponent = this.props.itemComponent || DefaultItemContainer;

        return (
            <div ref={this.containerRef} style={{ ...this.props.containerStyle, flex: '1 1 100%' }}>
                <AutoSizer disableHeight={!fill}>
                    {({ width, height }) => (
                        <Grid
                            height={fill ? height : maxHeight}
                            width={width}
                            columnWidth={() => this.props.width || width}
                            columnCount={1}
                            rowCount={items.length}
                            rowHeight={itemHeight}
                            scrollToRow={this.props.highlightedIndex}
                            onScroll={({ scrollLeft, scrollTop }) => this.handleScroll(scrollTop, scrollLeft)}
                            cellRenderer={({ rowIndex, style }) => (
                                <ItemComponent key={rowIndex} {...{ style: this.getItemStyle(items[rowIndex], style), node: items[rowIndex] }}>
                                    <Node
                                        isHighlighted={this.props.highlightedIndex === rowIndex}
                                        height={itemHeight}
                                        hideExpander={!!this.filter}
                                        model={items[rowIndex]}
                                        options={this.props}
                                    />
                                </ItemComponent>
                            )}
                        />
                    )}
                </AutoSizer>
            </div>
        );
    }

    componentDidUpdate(prevProps: ITreeProps) {
        if (prevProps.items !== this.props.items) {
            this.loadNodes();
        }
        if (prevProps.filter !== this.props.filter) {
            this.applyFilter(this.props.filter);
        }
    }
    componentWillUnmount() {
        this.disposers.forEach(d => d());
    }
    componentDidMount() {
        this.loadNodes();
        if (this.props.filter) {
            this.applyFilter(this.props.filter);
        }
    }
    private getItemStyle(node: TreeNode<ExpandableItem>, style: React.CSSProperties): React.CSSProperties {
        return {
            ...style,
            ...(this.props.itemContainerStyle ? this.props.itemContainerStyle(node.item.data) : undefined)
        };
    }
    private getItemHeight() {
        return this.props.itemHeight || 25;
    }
    private loadNodes() {
        const items = this.props.items.map(item => this.createItem(item));
        this.treeQuery = new TreeQuery<ExpandableItem>(item => this.props.childrenAccessor(item.data).map(child => this.createItem(child)));
        this.query = this.treeQuery
            .query(items)
            .hasDescendant(d => (!this.filter ? true : this.filter.test(d.text)))
            .whereNode(n => !!this.filter || [...n.ancestors()].every(a => a.item.expanded || a.isRoot));

        this.callQueryCreated(this.query);
    }
    private createItem(data: any) {
        return new ExpandableItem(data, () => this.props.textAccessor(data));
    }
    private applyFilter(filterText?: string) {
        const regex = !filterText ? undefined : new RegExp(filterText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        this.filter = regex;
    }
    private handleScroll(top: number, left: number) {
        if (this.props.onScroll) {
            this.props.onScroll(top, left);
        }
    }
    private callQueryCreated(query: Query<ExpandableItem>) {
        if (this.props.onQueryCreated) {
            this.props.onQueryCreated(query);
        }
    }
}
@observer
export class Node extends React.Component<{
    isHighlighted: boolean;
    model: TreeNode<ExpandableItem>;
    options: ITreeProps;
    hideExpander?: boolean;
    height: number;
}> {
    render() {
        return <NodeContainer>{this.renderItem()}</NodeContainer>;
    }
    renderItem() {
        const { model, options } = this.props;
        return (
            <NodeItem height={this.props.height}>
                {this.renderLines()}
                {options.nodeRenderer ? (
                    options.nodeRenderer(model.item.data, model.item, model, this.props.isHighlighted)
                ) : (
                    <NodeText onClick={() => this.handleItemClick(model)} highlight={this.props.isHighlighted}>
                        {options.textAccessor(model.item.data)}
                    </NodeText>
                )}
            </NodeItem>
        );
    }
    private renderLines() {
        const model = this.props.model,
            hasExpander = !!model.children.length && !this.props.hideExpander;
        if (this.props.options.noHierarchy) {
            return null;
        } else if (model.parent!.isRoot) {
            return (
                <NodeLine hasNext={false} hasExpander={hasExpander} isChild={false} key={-1}>
                    {hasExpander ? this.renderExpander() : null}
                </NodeLine>
            );
        } else {
            return (
                <>
                    {[...model.ancestors()]
                        .reverse()
                        .map(n =>
                            n.isRoot ? null : n.parent!.isRoot ? (
                                <NodeLine hasNext={false} isChild={false} key={-1} />
                            ) : (
                                <NodeLine key={n.rootIndex} isChild={false} hasNext={!n.isLastChild} />
                            )
                        )}
                    <NodeLine key={-1} isChild hasExpander={hasExpander} hasNext={!model.isLastChild}>
                        {hasExpander ? this.renderExpander() : null}
                    </NodeLine>
                </>
            );
        }
    }
    renderExpander() {
        const { model } = this.props;
        return (
            <Expander tabIndex={-1} href="javascript:" onClick={() => (model.item.expanded = !model.item.expanded)}>
                <i className={`far fa-${model.item.expanded ? 'minus' : 'plus'}-square fa-stack-1x`} />
            </Expander>
        );
    }
    handleItemClick(node: TreeNode<ExpandableItem>) {
        if (this.props.options.onNodeClick) {
            this.props.options.onNodeClick(node.item.data);
        }
    }
}

const expanderSize = 20;
const NodeContainer = styled.div``;

const NodeLine = styled.div<{ hasNext: boolean; isChild: boolean; hasExpander?: boolean }>`
    flex: 0 0 auto;
    width: ${expanderSize}px;
    height: 25px;
    position: relative;
    display: flex;
    ::before {
        content: ' ';
        position: absolute;
        left: 50%;
        height: 100%;
        width: 1px;
        border-width: ${p =>
            p.hasNext && p.hasExpander
                ? '7px 0'
                : p.hasNext && !p.hasExpander
                ? '0 0 0 1px'
                : p.isChild && p.hasExpander
                ? '7px 0 0 0'
                : p.isChild && !p.hasExpander
                ? '13px 0 0 0'
                : '0'};
        border-style: solid;
        border-color: #0005;
        display: ${p => (p.isChild || p.hasNext ? 'block' : 'none')};
    }
    ::after {
        content: ' ';
        position: absolute;
        width: ${p => (!p.hasExpander ? '50%' : '25%')};
        height: 1px;
        right: 0;
        bottom: 50%;
        border-top: solid 1px #0005;
        display: ${p => (p.isChild ? 'block' : 'none')};
    }
`;

const ScrollArea = styled.div`
    overflow: auto;
`;

const NodeItem = styled.div<{ height: number }>`
    display: flex;
    justify-content: flex-start;
    line-height: ${p => p.height || 25}px;
`;

const Expander = styled.a`
    display: block;
    width: ${expanderSize}px;
    text-align: center;
    flex: 0 0 auto;
`;

const NodeText = styled.div<{ highlight?: boolean }>`
    cursor: pointer;
    background-color: ${p => (p.highlight ? '#4a90e288' : 'none')};
    flex: 1 1 auto;
    padding: 0 5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
    :hover {
        background: ${p => (p.highlight ? '#4a90e2aa' : '#0001')};
    }
`;

const DefaultItemContainer = styled.div``;

export class TreeQuery<T> {
    constructor(private childAccessor?: (item: T) => T[] | undefined) {}
    public query(items: T[]) {
        return Query.init<T>(items, this.childAccessor);
    }
}

export class Query<T> implements Iterable<TreeNode<T>> {
    private rootNode!: TreeNode<T>;
    private nodeLookup = new Map<T, TreeNode<T>>();
    private iterate: () => IterableIterator<TreeNode<T>>;
    private customMove: (current: TreeNode<T>, defaultNext?: TreeNode<T>) => TreeNode<T> | undefined = (current, def) => def;

    private constructor(iterator?: () => IterableIterator<TreeNode<T>>) {
        this.iterate = iterator ? iterator : this.forwardIterator();
    }

    public static init<T>(items: T[], childAccessor?: (item: T) => T[] | undefined) {
        let query = new Query<T>(),
            rootIndex = -1,
            rootItem = { items } as any,
            depth = -1;

        const createNode = (item: T, parent?: TreeNode<T>, prev?: TreeNode<T>, index?: number): TreeNode<T> => {
            const children: TreeNode<T>[] = [],
                result = new TreeNode<T>(prev, parent, depth, item, rootIndex++, index || 0, children),
                childItems = item === rootItem ? rootItem.items : childAccessor ? childAccessor(item) : [];

            query.nodeLookup.set(item, result);

            if (childItems) {
                depth++;
                let previous: TreeNode<T> | undefined;
                for (let i = 0; i < childItems.length; i++) {
                    const childItem = childItems[i],
                        child = createNode(childItem, result, previous, i);

                    children.push(child);

                    previous = child;
                }
                depth--;
            }

            return result;
        };

        query.rootNode = createNode(rootItem, undefined);

        return query;
    }

    private extend(iterator: () => IterableIterator<TreeNode<T>>): Query<T> {
        const result = new Query<T>(iterator);
        result.rootNode = this.rootNode;
        result.nodeLookup = this.nodeLookup;
        return result;
    }

    public skip(count: number) {
        let iterator = this.iterate;
        return this.extend(function*() {
            let i = 0;
            for (let node of iterator()) {
                if (i >= count) {
                    yield node;
                }
                i++;
            }
        });
    }

    public take(count: number) {
        let iterator = this.iterate;
        return this.extend(function*() {
            let i = 0;
            for (let node of iterator()) {
                if (i >= count) {
                    break;
                }
                yield node;
                i++;
            }
        });
    }

    public whereNode(filter: (node: TreeNode<T>) => boolean) {
        let iterator = this.iterate;
        return this.extend(function*() {
            for (let node of iterator()) {
                if (filter(node)) {
                    yield node;
                }
            }
        });
    }

    public hasDescendant(filter: (item: T) => boolean, excludeMatch: boolean = false) {
        return this.hasDescendantNode(n => filter(n.item), excludeMatch);
    }
    public hasDescendantNode(filter: (node: TreeNode<T>) => boolean, excludeMatch: boolean = false) {
        const iterator = this.iterate,
            self = this;

        return this.extend(function*() {
            let matches = new Set<TreeNode<T>>();
            for (let node of self.ascend()) {
                if (!matches.has(node) && filter(node)) {
                    if (!excludeMatch) {
                        matches.add(node);
                    }
                    for (let p of node.ancestors()) {
                        matches.add(p);
                    }
                }
            }

            for (let node of iterator()) {
                if (matches.has(node)) {
                    yield node;
                }
            }
        });
    }

    public count() {
        let result = 0;
        for (let node of this.iterate()) {
            result++;
        }
        return result;
    }

    public nth(n: number) {
        const result = this.skip(n)
            .take(1)
            .toArray()
            .find(() => true);
        return result;
    }

    public where(filter: (item: T) => boolean) {
        return this.whereNode(n => filter(n.item));
    }

    public ascend(from?: T, wrap?: boolean) {
        const node = (from && this.findNode(from)) || undefined;
        return this.extend(this.reverseIterator(node, wrap));
    }

    public descend(from?: T, wrap?: boolean) {
        const node = (from && this.findNode(from)) || undefined;
        return this.extend(this.forwardIterator(node, wrap));
    }

    public provideNext(provider: (current: TreeNode<T>, defaultNext?: TreeNode<T>) => undefined | TreeNode<T>) {
        this.customMove = provider;
        return this;
    }

    public toArray() {
        const result = [];
        for (let item of this) {
            result.push(item);
        }
        return result;
    }

    public [Symbol.iterator](): Iterator<TreeNode<T>> {
        return this.iterate();
    }

    public getRootNode() {
        return this.rootNode;
    }

    public findNode(item: T) {
        return this.nodeLookup.get(item);
    }

    private reverseIterator(from?: TreeNode<T>, wrap?: boolean) {
        const self = this;
        return function*() {
            let lastChild = (node?: TreeNode<T>) => {
                    let current: TreeNode<T> | undefined = node;
                    while (current) {
                        if (!current.lastChild) {
                            return current;
                        }
                        current = current.lastChild;
                    }
                },
                start = from || lastChild(self.rootNode)!,
                current: TreeNode<T> | undefined = start;

            do {
                if (!current.isRoot) {
                    yield current;
                }
                let next = lastChild(current.prev) || current.prev || current.parent;
                if (!current && wrap) {
                    next = lastChild(self.rootNode);
                }
                current = self.customMove(current, next);
                if (current === start) {
                    break;
                }
            } while (!!current);
        };
    }

    private forwardIterator(from?: TreeNode<T>, wrap?: boolean) {
        const self = this;
        return function*() {
            let start = from || self.rootNode,
                current: TreeNode<T> | undefined = start;
            do {
                if (!current.isRoot) {
                    yield current;
                }
                let next: TreeNode<T> | undefined = current.firstChild || current.next;
                if (!next) {
                    for (let parent of current.ancestors()) {
                        if (parent.next) {
                            next = parent.next;
                            break;
                        }
                    }
                }
                current = self.customMove(current, next);
                if (!next && wrap) {
                    current = self.rootNode;
                }
                if (current === start) {
                    break;
                }
            } while (!!current);
        };
    }
}

export class TreeNode<T> {
    private _next?: TreeNode<T>;
    private _children: TreeNode<T>[];

    public get next() {
        return this._next;
    }
    public get children() {
        return this._children.slice();
    }
    public get isLastChild() {
        return !this.next;
    }
    public get isFirstChild() {
        return !this.prev;
    }
    public get isRoot() {
        return !this.parent;
    }
    public get firstChild(): TreeNode<T> | undefined {
        return this.children[0];
    }
    public get lastChild(): TreeNode<T> | undefined {
        return this.children[this.children.length - 1];
    }
    public ancestors(): IterableIterator<TreeNode<T>> {
        const self = this;
        return (function*() {
            let current: TreeNode<T> | undefined = self;
            while ((current = current.parent) !== undefined) {
                yield current;
            }
        })();
    }

    constructor(
        public readonly prev: TreeNode<T> | undefined,
        public readonly parent: TreeNode<T> | undefined,
        public readonly depth: number,
        public readonly item: T,
        public readonly rootIndex: number,
        public readonly index: number,
        children: TreeNode<T>[]
    ) {
        if (prev) {
            prev._next = this;
        }
        this._children = children;
    }
}
