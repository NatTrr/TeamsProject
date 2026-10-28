import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from './theme';
import { useAuth, PetType } from './auth';
import { useI18n } from './i18n';
import TabBar from './TabBar';
import Welcome from './screens/Welcome';
import SignIn from './screens/SignIn';
import OwnerSignup from './screens/OwnerSignup';
import ShopSignup from './screens/ShopSignup';
import Home from './screens/Home';
import Animal from './screens/Animal';
import FoodChat from './screens/FoodChat';
import Soon from './screens/Soon';
import Profile from './screens/Profile';
import PlaceDetail from './screens/PlaceDetail';
import Walker from './screens/Walker';
import WriteReview from './screens/WriteReview';
import Saved from './screens/Saved';
import MapScreen from './screens/MapScreen';
import MyPets from './screens/MyPets';
import Reminders from './screens/Reminders';
import NewReminder from './screens/NewReminder';
import LostFound from './screens/LostFound';
import ReportPet from './screens/ReportPet';
import WalkerDash from './screens/WalkerDash';
import MyRequests from './screens/MyRequests';
import MyPlaces from './screens/MyPlaces';
import PlaceForm from './screens/PlaceForm';

export type RootStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  OwnerSignup: undefined;
  ShopSignup: undefined;
  Main: undefined;
  PlaceDetail: { id: string };
  Walker: { id: string };
  MyPets: undefined;
  Reminders: undefined;
  NewReminder: undefined;
  LostFound: undefined;
  ReportPet: undefined;
  WalkerDash: undefined;
  MyRequests: undefined;
  PlaceForm: { id?: string } | undefined;
  WriteReview: { targetType: 'Place' | 'Walker'; targetId: string; name: string; reviewId?: string; rating?: number; comment?: string | null };
};

export type HomeStackParamList = {
  HomeMain: undefined;
  Animal: { petType: PetType; tab?: 'Walkers' | 'Shops' | 'DogParks' | 'Vets' };
  FoodChat: { petType: PetType };
  Soon: { title: string };
};

const Root = createNativeStackNavigator<RootStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const Tabs = createBottomTabNavigator();
const navTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.cream } };

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <HomeStack.Screen name="HomeMain" component={Home} />
      <HomeStack.Screen name="Animal" component={Animal} />
      <HomeStack.Screen name="FoodChat" component={FoodChat} />
      <HomeStack.Screen name="Soon" component={Soon} />
    </HomeStack.Navigator>
  );
}


function MainTabs() {
  const { isShopOwner } = useAuth();
  return (
    <Tabs.Navigator tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false }}>
      {isShopOwner ? (
        <>
          <Tabs.Screen name="PlacesTab" component={MyPlaces} />
          <Tabs.Screen name="MapTab" component={MapScreen} />
          <Tabs.Screen name="ProfileTab" component={Profile} />
        </>
      ) : (
        <>
          <Tabs.Screen name="HomeTab" component={HomeStackScreen} />
          <Tabs.Screen name="MapTab" component={MapScreen} />
          <Tabs.Screen name="SavedTab" component={Saved} />
          <Tabs.Screen name="ProfileTab" component={Profile} />
        </>
      )}
    </Tabs.Navigator>
  );
}

export default function Navigation() {
  const { user, ready } = useAuth();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Root.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {user ? (
          <>
            <Root.Screen name="Main" component={MainTabs} />
            <Root.Screen name="PlaceDetail" component={PlaceDetail} />
            <Root.Screen name="Walker" component={Walker} />
            <Root.Screen name="WriteReview" component={WriteReview} />
            <Root.Screen name="MyPets" component={MyPets} />
            <Root.Screen name="Reminders" component={Reminders} />
            <Root.Screen name="NewReminder" component={NewReminder} />
            <Root.Screen name="LostFound" component={LostFound} />
            <Root.Screen name="ReportPet" component={ReportPet} />
            <Root.Screen name="WalkerDash" component={WalkerDash} />
            <Root.Screen name="PlaceForm" component={PlaceForm} />
            <Root.Screen name="MyRequests" component={MyRequests} />
          </>
        ) : (
          <>
            <Root.Screen name="Welcome" component={Welcome} />
            <Root.Screen name="SignIn" component={SignIn} />
            <Root.Screen name="OwnerSignup" component={OwnerSignup} />
            <Root.Screen name="ShopSignup" component={ShopSignup} />
          </>
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}
