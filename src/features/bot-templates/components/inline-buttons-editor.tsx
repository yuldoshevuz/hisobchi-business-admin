import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { InlineButton } from '../api/bot-templates.api';

interface InlineButtonsEditorProps {
  rows: InlineButton[][];
  onChange: (rows: InlineButton[][]) => void;
}

const MAX_ROWS = 6;
const MAX_BUTTONS_PER_ROW = 4;

export function InlineButtonsEditor({
  rows,
  onChange,
}: InlineButtonsEditorProps): React.ReactElement {
  function addRow(): void {
    if (rows.length >= MAX_ROWS) return;
    onChange([...rows, [{ text: '', url: '' }]]);
  }

  function removeRow(rowIndex: number): void {
    onChange(rows.filter((_, i) => i !== rowIndex));
  }

  function addButton(rowIndex: number): void {
    const row = rows[rowIndex];
    if (!row || row.length >= MAX_BUTTONS_PER_ROW) return;
    const next = rows.map((r, i) =>
      i === rowIndex ? [...r, { text: '', url: '' }] : r,
    );
    onChange(next);
  }

  function removeButton(rowIndex: number, btnIndex: number): void {
    const next = rows
      .map((r, i) => (i === rowIndex ? r.filter((_, j) => j !== btnIndex) : r))
      .filter((r) => r.length > 0);
    onChange(next);
  }

  function updateButton(
    rowIndex: number,
    btnIndex: number,
    field: 'text' | 'url',
    value: string,
  ): void {
    const next = rows.map((r, i) =>
      i === rowIndex
        ? r.map((b, j) => (j === btnIndex ? { ...b, [field]: value } : b))
        : r,
    );
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Tugmalar (havola tugmalari)</h4>
          <p className="text-xs text-muted-foreground">
            Har bir qator chap-o&apos;ngga joylashadi. Bir qatorda 4 ta, jami 6
            qator. Tugmasiz qoldirish uchun barchasini o&apos;chiring.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          disabled={rows.length >= MAX_ROWS}
        >
          <Plus className="h-3.5 w-3.5" />
          Qator qo&apos;shish
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed py-4 text-center text-xs text-muted-foreground">
          Hozircha hech qanday tugma yo&apos;q.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row, rowIndex) => (
            <li key={rowIndex} className="rounded-md border bg-card p-2">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Qator {rowIndex + 1}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addButton(rowIndex)}
                    disabled={row.length >= MAX_BUTTONS_PER_ROW}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tugma
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRow(rowIndex)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {row.map((btn, btnIndex) => (
                  <div
                    key={btnIndex}
                    className="grid grid-cols-[1fr_2fr_auto] gap-2"
                  >
                    <Input
                      placeholder="Tugma matni"
                      value={btn.text}
                      onChange={(e) =>
                        updateButton(
                          rowIndex,
                          btnIndex,
                          'text',
                          e.target.value,
                        )
                      }
                    />
                    <Input
                      placeholder="https://..."
                      value={btn.url}
                      onChange={(e) =>
                        updateButton(rowIndex, btnIndex, 'url', e.target.value)
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeButton(rowIndex, btnIndex)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
