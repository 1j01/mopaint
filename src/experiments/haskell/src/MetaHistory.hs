{-# LANGUAGE DataKinds #-}
{-# LANGUAGE FlexibleContexts #-}
{-# LANGUAGE OverloadedRecordDot #-}
{-# LANGUAGE ScopedTypeVariables #-}

module MetaHistory
  ( resolveMetaHistory,
    MHOperation (..),
    MHOperationData (..),
  )
where

import Data.List (find)
import Data.Maybe (fromJust, listToMaybe)

data MHOperation = MHOperation
  { id :: String,
    name :: String,
    metaLevel :: Int,
    opData :: MHOperationData
  }
  deriving (Show, Eq)

data MHOperationData
  = Undo
      {target :: String}
  | Recolor
      { target :: String,
        color :: String
      }
  | Insert
      { insertIndex :: Int,
        insertOp :: MHOperation
      }
  | -- TODO: separate into HOperationData for non-meta operations?
    Circle
      { color :: String
      }
  | Triangle
      { color :: String
      }
  | Line
      { color :: String
      }
  deriving (Show, Eq)

data Removal = Removal
  { removedOp :: MHOperation,
    removedByOp :: Maybe MHOperation
  }

findTargetOp :: [MHOperation] -> String -> Int -> [Removal] -> MHOperation
findTargetOp (metaHistory :: [MHOperation]) (targetID :: String) (metaOpMetaLevel :: Int) (removals :: [Removal]) = do
  --  Makes sure it matches a target, and the target is less meta than the meta operation.
  let isTargetOp op = op.id == targetID
  let targetOpMaybe = find isTargetOp metaHistory
  case targetOpMaybe of
    Nothing -> do
      -- TODO: check removals
      -- for (const { removedOp, removedByOp } of removals) {
      -- 	if (removedOp.id === targetID) {
      -- 		if (removedByOp) {
      -- 			throw new Error(`target operation '${targetID}' was already removed by operation '${removedByOp.id}'.`);
      -- 		} else {
      -- 			throw new Error(`target operation '${targetID}' was already applied and thus can't be affected.`);
      -- 		}
      -- 	}
      -- }
      error ("target operation '" ++ targetID ++ "' not found.")
    Just targetOp -> do
      if targetOp.metaLevel == metaOpMetaLevel
        then error ("target operation '" ++ targetID ++ "' has equal meta level to the meta operation. Meta operations must only target operations less meta than themselves.")
        else
          if targetOp.metaLevel > metaOpMetaLevel
            -- This may never happen, since operations will be removed upon application,
            -- so it will get the "already applied and thus can't be affected" error instead.
            then error ("target operation '" ++ targetID ++ "' has greater meta level than the meta operation. Meta operations must only target operations less meta than themselves.")
            else
              targetOp

without :: (Eq a) => [a] -> a -> [a]
without list elem = filter (/= elem) list -- name only makes sense infix, not when partially applied

resolveMetaHistory (metaHistory :: [MHOperation]) = do
  let maxMetaLevel = maximum (0 : [op.metaLevel | op <- metaHistory])
  if maxMetaLevel == 0
    then metaHistory
    else do
      let opsOfMaxMetaLevel = filter (\op -> op.metaLevel == maxMetaLevel) metaHistory
      let nextOpMaybe = listToMaybe opsOfMaxMetaLevel
      case nextOpMaybe of
        Nothing -> metaHistory -- should this be an error?
        Just nextOp -> do
          -- TODO: track removals for better error reporting (maybe)
          -- TODO: does removal order matter here, maybe for insert op type's insertIndex?
          let metaHistory' = applyMetaOperation nextOp.opData (metaHistory `without` nextOp)
          resolveMetaHistory (metaHistory')

applyMetaOperation :: MHOperationData -> [MHOperation] -> [MHOperation]
-- TODO: track removals for better error reporting (maybe)
applyMetaOperation Undo {target = targetID} metaHistory =
  -- metaHistory `without` (findTargetOp targetID)
  filter (\op -> op.id /= targetID) metaHistory
applyMetaOperation Recolor {target = targetID, color = newColor} metaHistory = do
  -- let targetOp = findTargetOp metaHistory targetID op.metaLevel removals
  [if op.id == targetID then op {opData = op.opData {color = newColor}} else op | op <- metaHistory]
applyMetaOperation Insert {insertIndex = insertIndex, insertOp = insertOp} metaHistory = do
  take insertIndex metaHistory ++ (insertOp : drop insertIndex metaHistory)
