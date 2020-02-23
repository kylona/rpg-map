import React from 'react'
import {
  View, Image, StyleSheet,
  Text, SafeAreaView, AsyncStorage,
  Alert, StatusBar, Platform
} from 'react-native'
import ReactNativeZoomableView from '@dudigital/react-native-zoomable-view/src/ReactNativeZoomableView'
import Draggable from '../Draggable'
import Button from '../Button'
import StyleGuide from '../StyleGuide'
import * as ImagePicker from 'expo-image-picker'
import Constants from 'expo-constants'
import * as Permissions from 'expo-permissions'
import Slider from "react-native-slider";




const dummyPlayers = [{
  name: 'Kylona',
  image: 'https://i.pinimg.com/originals/c7/fe/25/c7fe251cd11a2ecb590d7d9efa596a49.png',
  x: 150,
  y: 450,
  color: 'red'
}, {
  name: 'JBaczuk',
  image: 'https://i.pinimg.com/originals/81/11/10/81111081508e4e7bd138890ab2cdf9dd.png',
  x: 200,
  y: 500,
  color: 'blue'
}]

const getPermissionAsync = async () => {
  if (Constants.platform.ios) {
    const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
    }
  }
}

const pickToken = async () => {
  let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.All,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1
  });

  console.log(result);

  if (!result.cancelled) {
    return result.uri
  }

  return ''
};

const pickMap = async () => {
  let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.All,
    allowsEditing: false,
    quality: 1
  });

  console.log(result);

  if (!result.cancelled) {
    return result.uri
  }

  return ''
};

class Main extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      players: [],
      mapImage: props.mapUrl,
			gridScale: 25
    }
  }

  componentDidMount () {
    this.fetchData()
  }

  fetchData () {
    AsyncStorage.getItem('players')
      .then(playersString => {
        const players = JSON.parse(playersString)
        if (players) {
          const newState = this.state
          newState.players = players
          this.setState(newState)
        } else {
          this.setState({ players: [] })
        }
      })

    AsyncStorage.getItem('mapImage')
      .then(mapImageString => {
        const mapImage = JSON.parse(mapImageString)
        if (mapImage) {
          const newState = this.state
          newState.mapImage = mapImage
          this.setState(newState)
        }
      })
  }


  confirmDeleteAllPlayers = async () => {
    return new Promise((resolve) => {
      const title = 'Are you sure you want to delete all tokens?'
      const message = 'This will clear all tokens from the map.'
      const buttons = [
        {
          text: 'Cancel',
          onPress: () => resolve(false)
        },
        {
          text: 'Delete',
          onPress: () => {
            resolve(true)
          }
        }]
      Alert.alert(title, message, buttons, { cancelable: false })
    })
  }

  render () {

		const styles = {
			image: {
				flex: 1,
				width: '100%',
				height: null,
				zIndex: -1
			},
			main: {
				padding: StyleGuide.spacing
			},
			player: {
				height: this.state.gridScale,
				width: this.state.gridScale,
				alignItems: 'center',
				borderRadius: 4
			},
			header: {
				flexDirection: 'row',
				alignItems: 'space-around',
				justifyContent: 'center'
			},
			tokenDock: {
				flexDirection: 'row',
				alignItems: 'space-around',
				justifyContent: 'center'
			},
			footer: {
			}
		}
    const players = this.state.players.map(player => {
      const imageStyle = {
        backgroundColor: player.color
      }
      return (
        <Draggable key={player.name}>
          <Image source={{ uri: player.image }} style={[styles.player]}
          />
        </Draggable>
      )
    })

    return (
      <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 }}>
        <View style={styles.header}>
          <Button
            onPress={async () => {
              await getPermissionAsync()
              const image = await pickMap()
              if (image !== '') {
                this.state.mapImage = image
                await AsyncStorage.setItem('mapImage', JSON.stringify(image))
              }
              await this.fetchData()
            }}
          >
            <Text>Change Map</Text>
          </Button>
          <Button
            onPress={async () => {
              await getPermissionAsync()
              const image = await pickToken()
              if (image !== '') {
                const players = [...this.state.players]
                players.push({
                  name: 'Test Player' + players.length,
                  image,
                  x: 100,
                  y: 50,
                  color: 'blue'
                })
                await AsyncStorage.setItem('players', JSON.stringify(players))
              }
              await this.fetchData()
            }}
          >
            <Text>Add Token</Text>
          </Button>
          <Button
            onPress={async () => {
              const confirmed = await this.confirmDeleteAllPlayers()
              if (confirmed) {
                await AsyncStorage.removeItem('players')
                this.fetchData()
              }
            }}
          >
            <Text>Delete All Tokens</Text>
          </Button>
        </View>
        <View style={styles.header}>
					<Slider
						value={this.state.gridScale}
						onValueChange={(value) => {
							const newState = this.state
							newState.gridScale = value
							this.setState(newState)
						}}
					  style={{width: 200, height: 40}}
					  minimumValue={5}
					  maximumValue={50}
					  minimumTrackTintColor="#78c5ef"
					  maximumTrackTintColor="#000000"
					/>
        </View>
        <View style={styles.header}>
					<Text>Value: {this.state.gridScale.toFixed(0)}</Text>
        </View>

        <ReactNativeZoomableView
          maxZoom={2}
          minZoom={1}
          zoomStep={0.5}
          initialZoom={1}
          bindToBorders={true}
          // onZoomAfter={this.logOutZoomState}
          style={styles.main}
        >
          <View style={styles.tokenDock}>
            {players}
          </View>
          <Image style={styles.image}
            source={{ uri: this.state.mapImage }}
            resizeMode="contain" />
        </ReactNativeZoomableView>
        <View style={styles.footer} />
      </SafeAreaView>
    )
  }
}


export default Main
