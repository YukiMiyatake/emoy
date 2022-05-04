{-# LANGUAGE DataKinds #-}
{-# LANGUAGE TypeOperators #-}
{-# LANGUAGE DeriveGeneric #-}

module Lib
    ( runServant
    ) where

import Servant(serve, Proxy(..), Server, JSON, Get, (:>))
import Data.Aeson(ToJSON)
import Data.Time.Calendar
import GHC.Generics(Generic)
import Network.Wai(Application)
import Network.Wai.Handler.Warp(run)

data User = User
  { name :: String
  , age :: Int
  , email :: String
  , registration_date :: Day
  } deriving (Eq, Show, Generic)

instance ToJSON User


isaac :: User
isaac = User "Isaac Newton" 372 "isaac@newton.co.uk" (fromGregorian 1683 3 1)

albert :: User
albert = User "Albert Einstein" 136 "ae@mc2.org" (fromGregorian 1905 12 1)

users2 :: [User]
users2 = [isaac, albert]

type UserAPI2 = "users" :> Get '[JSON] [User]
           :<|> "albert" :> Get '[JSON] User
           :<|> "isaac" :> Get '[JSON] User

server2 :: Server UserAPI2
server2 = return users2
     :<|> return albert
     :<|> return isaac
     

userAPI :: Proxy UserAPI1
userAPI = Proxy

-- serve allows you to implement an API and produce a wai Application.
-- serve :: HasServer api '[] => Proxy api -> Server api -> Application
app1 :: Application
app1 = serve userAPI server1



runServant :: IO ()
runServant = run 8080 app1