
import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Database, Table2, Key } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const tables = [
  {
    name: "attendance_records",
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "date", type: "date", nullable: false },
      { name: "present_members", type: "integer[]", nullable: true, default: "'{}'::integer[]" },
      { name: "present_guests", type: "integer[]", nullable: true, default: "'{}'::integer[]" },
      { name: "created_by", type: "uuid", nullable: true },
      { name: "created_at", type: "timestamp with time zone", nullable: false, default: "now()" },
      { name: "updated_at", type: "timestamp with time zone", nullable: false, default: "now()" }
    ]
  },
  {
    name: "guests",
    columns: [
      { name: "id", type: "integer", nullable: false, default: "nextval('guests_id_seq'::regclass)" },
      { name: "name", type: "text", nullable: false },
      { name: "present", type: "boolean", nullable: true, default: "false" },
      { name: "created_at", type: "timestamp with time zone", nullable: false, default: "now()" },
      { name: "updated_at", type: "timestamp with time zone", nullable: false, default: "now()" }
    ]
  },
  {
    name: "profiles",
    columns: [
      { name: "id", type: "uuid", nullable: false },
      { name: "email", type: "text", nullable: false },
      { name: "created_at", type: "timestamp with time zone", nullable: false, default: "now()" },
      { name: "updated_at", type: "timestamp with time zone", nullable: false, default: "now()" }
    ]
  },
  {
    name: "user_roles",
    columns: [
      { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: false },
      { name: "role", type: "app_role", nullable: false, default: "'user'::app_role" },
      { name: "created_at", type: "timestamp with time zone", nullable: true, default: "now()" }
    ]
  }
];

export const DatabaseStructure = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Database className="h-6 w-6" />
        <h2 className="text-2xl font-semibold">Struktura bazy danych</h2>
      </div>
      
      <div className="grid gap-6">
        {tables.map((table) => (
          <Card key={table.name}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table2 className="h-5 w-5" />
                {table.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kolumna</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Wymagane</TableHead>
                    <TableHead>Wartość domyślna</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.columns.map((column) => (
                    <TableRow key={`${table.name}-${column.name}`}>
                      <TableCell className="font-medium flex items-center gap-2">
                        {column.name === "id" && <Key className="h-4 w-4" />}
                        {column.name}
                      </TableCell>
                      <TableCell>{column.type}</TableCell>
                      <TableCell>{column.nullable ? "Nie" : "Tak"}</TableCell>
                      <TableCell>{column.default || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
