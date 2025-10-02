
import { getAllTodos, getDBVersion, getSQLiteVersion, migrateDB } from "@/database";
import { FilterType, TodoItem, uuid } from "@/types";
import * as crypto from "expo-crypto";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import React, { useEffect, useState } from "react";
import { Button, Keyboard, StyleSheet, Text, TextInput, View } from "react-native";
import { FlatList, GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

function ListItem({ todoItem, toggleTodo }: { todoItem: TodoItem; toggleTodo: (id: uuid) => void }) {

  const handlePress = (id: uuid) => {
    console.log(`Todo item with id ${id} marked as complete.`);
    toggleTodo(id);
  };

  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      {!todoItem.done ? (
        <>
          <Text style={styles.item}>{todoItem.text}</Text>
          <Button title="Concluir" onPress={() => {handlePress(todoItem.id)}} color="green" />
        </>
      ) : (
        <Text style={styles.itemdone}>{todoItem.text}</Text>
      )}
    </View>
  );
}

function Footer() {
  const db = useSQLiteContext();
  const [sqliteVersion, setSqliteVersion] = useState<string>("");
  const [dbVersion, setDBVersion] = useState<string>();

  useEffect( () => {
    async function setup(){
      const sqliteVersionResult = await getSQLiteVersion(db);

      if (sqliteVersionResult) {
        setSqliteVersion(sqliteVersionResult['sqlite_version()']);
      }
      else {
        setSqliteVersion('unknown');
      }

      const dbVersionResult = await getDBVersion(db);

      if (dbVersionResult) {
        setDBVersion(dbVersionResult['user_version'].toString());
      }
      else {
        setDBVersion('unknown');
      }
    }
    setup();
  }, [db]);

  return (
    <View>
      <Text style={{padding: 20}}>SQLite version: {sqliteVersion} / DBVersion: {dbVersion}</Text>
    </View>
  );
}

function AddTodoForm({ addTodoHandler }: { addTodoHandler: (text: string) => void }) {
  const [text, setText] = React.useState("");

  const handlePress = () => {
    if(text.trim().length === 0) return;
    
    addTodoHandler(text);
    setText("");
    Keyboard.dismiss();
  };

  return (
    <View style={{ width: "100%", marginTop: 10, paddingHorizontal: 20, alignItems: "center" }}>
      <TextInput
        value={text}
        onChangeText={setText}
        style={styles.textInput}
        placeholder="O que você precisa fazer?"
        placeholderTextColor="#000"
        onSubmitEditing={handlePress}
        returnKeyType="done"
      />
    </View>
  );
}


export function TodoList() {
  
  const [todos, setTodos] = React.useState<TodoItem[]>([]);
  const [filter, setFilter] = React.useState<FilterType>(FilterType.ALL);

  const db = useSQLiteContext();

  useEffect(() => {
    async function load() {
      const result = await getAllTodos(db);
      setTodos(result);
    }
  
    load();
  }, [db])

  const addTodo = (text: string) => {
    setTodos([...todos, { id: crypto.randomUUID(), text: text, done: false, createdAt: new Date() }]);
  };

  const toggleTodo = (id: uuid) => {
    setTodos(todos.map(todo => todo.id === id ? { ...todo, done: !todo.done } : todo));
  };

  const filteredTodos = React.useMemo(() => {
    return todos
      .filter(todo => {
        if (filter === FilterType.ALL) return true;
        if (filter === FilterType.PENDING) return !todo.done;
        return todo.done;
      })
      .sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1));
  }, [todos, filter]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <Text style={{ fontSize: 32, fontWeight: "bold", marginTop: 20 }}>
        TODO List
      </Text>
      <AddTodoForm addTodoHandler={addTodo} />

      <View style={styles.filterContainer}>
        {Object.values(FilterType).map((filterType) => (
          <Button
            key={filterType}
            title={filterType}
            onPress={() => setFilter(filterType)}
            color={filter === filterType ? "#007AFF" : "#999999"}
          />
        ))}
      </View>
      <FlatList
        style={styles.list}
        data={filteredTodos}
        renderItem={({ item }) => <ListItem todoItem={item} toggleTodo={toggleTodo} />}
      />
    </GestureHandlerRootView>
  );
}


export default function Index() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
        <SQLiteProvider databaseName="todos.db" onInit={migrateDB}>
          <TodoList />
          <Footer />
        </SQLiteProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignContent: "center",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  textInput: {
    width: "100%",
    borderColor: "black",
    borderWidth: 1,
    margin: 10,
    padding: 10,
    borderRadius: 50,
  },
  item: {
    padding: 10,
    fontSize: 18,
    height: 44,
  },
  itemdone: {
    padding: 10,
    fontSize: 18,
    height: 44,
    textDecorationLine: "line-through",
  },
  list: {
    width: "100%",
    backgroundColor: "white",
    padding: 10,
    marginTop: 20,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 10,
  },
});




