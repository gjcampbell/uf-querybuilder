import * as React from "react";
import styled from "styled-components";
import { Tooltip } from "material-ui";
import { observer } from "mobx-react";
import { observable } from "mobx";
import { Popover } from "material-ui";

export const colors = {
  labels: {
    purple: "#BB9EEE",
    blue: "#6694E8",
    teal: "#26a69a",
    indigo: "#7986cb",
    orange: "#F3A173",
    highlight: "#B1CF5F88"
  },
  text: {
    blue: "#4a90e2",
    brown: "#8b572a",
    default: "#222",
    disabled: "#2228",
    error: "#C60C30"
  }
};

export class Prompt extends React.Component<{
  onSubmit?: () => void;
  submitRequiresModifier?: boolean;
  style?: React.CSSProperties;
}> {
  render() {
    return (
      <PromptEl
        style={this.props.style}
        onKeyPress={(e) => this.handleKeypress(e)}
      >
        {this.props.children}
      </PromptEl>
    );
  }
  handleKeypress(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.which === 13) {
      let canSubmit = !!this.props.onSubmit;
      const hasModifier = e.shiftKey || e.ctrlKey,
        requireModifier = !!this.props.submitRequiresModifier;
      if (canSubmit && (!requireModifier || hasModifier)) {
        this.props.onSubmit!();
      }
    }
  }
}

export class OperandText extends React.Component<{
  bold?: boolean;
  italic?: boolean;
  order?: number;
  tooltip?: string;
  color?: string;
  anchorRef?: React.RefObject<HTMLAnchorElement>;
  onClick: () => void;
  tabbable?: boolean;
  highlight?: boolean;
}> {
  render() {
    return this.props.tooltip ? (
      <Tooltip title={this.props.tooltip}>{this.renderText()}</Tooltip>
    ) : (
      this.renderText()
    );
  }
  renderText() {
    return (
      <OperandTextEl
        href={this.props.tabbable ? "javascript:" : undefined}
        ref={this.props.anchorRef}
        {...this.props}
      />
    );
  }
}

export const PromptEl = styled.div`
  padding: 8px 15px;
`;

export const PromptFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

export const GroupContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  flex: 1 1 100%;
`;
export const GroupHeader = styled.div`
  flex: 0 0 auto;
  display: flex;
  flex-direction: row;
  align-items: center;
  ::after {
    display: block;
    content: " ";
    height: 100%;
    border: solid 5px ${(p) => p.color};
    border-radius: 7px;
    width: 7px;
    border-right-width: 0;
  }
`;

export const GroupBody = styled.div`
  flex: 1 1 100%;
  padding: 5px 0;
`;

export const OperationName = styled.a`
  border-radius: 3px;
  background-color: ${(p) => p.color};
  color: #fff;
  font-weight: bold;
  display: block;
  white-space: nowrap;
  text-transform: uppercase;
  padding: 4px 6px;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  cursor: pointer;
  :hover {
    text-decoration: none;
    color: #fff;
  }
`;

export const ExprRowLabel = styled.div<{ color: string }>`
  flex: 0 0 0;
  color: ${(p) => p.color};
  font-weight: bold;
  padding: 2px 4px 2px 0;
  display: flex;
  align-items: center;
`;

export const FillRow = styled.div`
  flex: 1 1 100%;
`;

export const ExprRow = styled.div<{
  borderless?: boolean;
  highlight?: boolean;
  noFill?: boolean;
}>`
  display: flex;
  border-top: solid ${(p) => (p.borderless ? 0 : 1)}px #0004;
  padding: 1px 0 1px 2px;
  align-items: center;
  background: ${(p) => (p.highlight ? colors.labels.highlight : "none")};
  flex: ${(p) => (p.noFill ? "0 0 auto" : "1 1 100%")};
  ::before {
    content: " ";
    display: block;
    flex: 1 1 auto;
    order: 2;
  }
`;

export const OperandTextEl = styled.a<{
  bold?: boolean;
  italic?: boolean;
  order?: number;
  color?: string;
  highlight?: boolean;
  unclickable?: boolean;
}>`
  display: block;
  font-weight: ${(p) => (p.bold ? "bold" : "normal")};
  font-style: ${(p) => (p.italic ? "italic" : "normal")};
  color: ${(p) => p.color || "#000"};
  order: ${(p) => p.order || 0};
  white-space: nowrap;
  padding: 2px 4px;
  background: ${(p) => (p.highlight ? colors.labels.highlight : "none")};
  cursor: ${(p) => (p.unclickable ? "default" : "pointer")};
  text-decoration: none;
  :hover {
    text-decoration: ${(p) => (p.unclickable ? "none" : "underline")};
    color: ${(p) => p.color};
  }
  :link,
  :visited {
    color: ${(p) => p.color};
  }
  :focus {
    outline-color: #000;
    outline-style: dashed;
    outline-width: 1px;
  }
`;

export const EmptyText = () => (
  <OperandTextEl color={colors.text.disabled}>[Empty]</OperandTextEl>
);

export class MenuSelectable extends React.Component<{
  selected: boolean;
  onClick: () => void;
  text: string;
}> {
  render() {
    return (
      <MenuSelectableItem onClick={this.props.onClick}>
        {this.props.selected ? <i className="fa fa-check" /> : null}
        {this.props.text}
      </MenuSelectableItem>
    );
  }
}

export const CompactMenu = styled.div`
  min-width: 160px;
  padding: 5px 10px;
`;

export const CompactMenuItem = styled.a`
  display: block;
  line-height: 20px;
  padding: 0 10px;
`;

export const MenuSelectableItem = styled(CompactMenuItem)`
  cursor: pointer;
  :hover {
    text-decoration: none;
    background-color: #0002;
  }
  i {
    margin: 0 5px;
  }
`;

interface IOperandElProps {
  color?: string;
  bold?: boolean;
  italic?: boolean;
  noFocus?: boolean;
  order?: number;
  tooltip?: string;
  highlight?: boolean;
  children: {
    text: React.ReactNode;
    editor?: (close: () => void) => React.ReactNode;
    onClose?: () => void;
    onOpen?: () => void;
  };
}

@observer
export class OperandEl extends React.Component<IOperandElProps> {
  private textRef = React.createRef<HTMLAnchorElement>();
  @observable
  private isOpen = false;
  render() {
    const {
      color,
      bold,
      italic,
      noFocus,
      order,
      children,
      tooltip,
      highlight
    } = this.props;
    return (
      <>
        <OperandText
          tabbable={!noFocus}
          anchorRef={this.textRef}
          color={color}
          bold={bold}
          italic={italic}
          order={order}
          onClick={() => this.handleClick()}
          tooltip={tooltip}
          highlight={highlight}
        >
          {children.text}
        </OperandText>
        {!children.editor ? null : (
          <Popover
            open={this.isOpen}
            anchorEl={this.textRef.current}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            onClose={() => this.handleClose()}
          >
            {this.isOpen ? this.renderEditor() : null}
          </Popover>
        )}
      </>
    );
  }
  private renderEditor() {
    return (
      <div>{this.props.children.editor!(() => (this.isOpen = false))}</div>
    );
  }
  private handleClick() {
    if (this.props.children.editor) {
      this.isOpen = true;
      if (this.props.children.onOpen) {
        this.props.children.onOpen();
      }
    }
  }
  private handleClose() {
    if (this.props.children.onClose) {
      this.props.children.onClose();
    }
    this.isOpen = false;
  }
}
