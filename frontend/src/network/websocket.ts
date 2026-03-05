export interface WsMessage {
  type: string;
  [key: string]: unknown;
}

export class GameSocket {
  private ws: WebSocket | null = null;

  connect(onMessage: (msg: WsMessage) => void, onStatus?: (status: string) => void) {
    const wsUrl = import.meta.env.VITE_WS_URL ?? "ws://localhost:3001";
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => onStatus?.("已連線");
    this.ws.onclose = () => onStatus?.("已斷線");
    this.ws.onerror = () => onStatus?.("連線錯誤");
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WsMessage;
        onMessage(data);
      } catch {
        onStatus?.("收到非 JSON 訊息");
      }
    };
  }

  send(msg: WsMessage) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(msg));
  }

  close() {
    this.ws?.close();
  }
}
