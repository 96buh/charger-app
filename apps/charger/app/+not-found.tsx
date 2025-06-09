import { Link, Stack } from "expo-router";
import { StyleSheet, View } from "react-native";

export  default function NotFoundScreen(){
    return(
        <>
            <Stack.Screen options={{title:"Oops! Not Found"}}></Stack.Screen>
            <View style={styles.container}>
                <Link href="/(tabs)/home" style={styles.button}>
                    Go back to Home screen!
                </Link>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container:{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#25292e",
    },
    button: {
      fontSize: 20,
      textDecorationLine: "underline",
      color: "white",
    },
})