{-# LANGUAGE OverloadedStrings #-}
module Main where

--import Lib
import HtmlContent
-- import Network.HTTP.Types
-- import Network.Wai (Application, responseLBS)
-- import Network.Wai.Handler.Warp (run)

{- 
app :: Application
app _ respond = do
  putStrLn "hello"
  respond $ responseLBS
    status200
    [("Content-Type", "text/plain")]
    "Hello World!"
-}

main :: IO ()
-- main = run 8080 app
main = runServant
