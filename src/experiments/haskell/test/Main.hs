module Main (main) where

import MetaHistory
import Test.Hspec
import Control.Exception (evaluate)

main :: IO ()
main = hspec $ do
    describe "resolveMetaHistory" $ do
        it "should resolve to a linear history without any meta operations" $ do
            resolveMetaHistory([
                { id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue" },
                { id: "abc2", metaLevel: 1, type: "recolor", name: "Edit Draw Line", target: "abc1", color: "green" },
                { id: "abc3", metaLevel: 2, type: "undo", name: "Undo Edit Draw Line", target: "abc2" },
                { id: "abc4", metaLevel: 3, type: "undo", name: "Undo Undo Edit Draw Line", target: "abc3" }, // AKA Redo
                { id: "abc5", metaLevel: 0, type: "circle", name: "Draw Circle", color: "pink" },
                { id: "abc6", metaLevel: 0, type: "triangle", name: "Draw Triangle", color: "red" },
                { id: "abc7", metaLevel: 1, type: "undo", name: "Undo Draw Triangle", target: "abc6" },
            ]) `shouldBe` [
                { id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "green" },
                { id: "abc5", metaLevel: 0, type: "circle", name: "Draw Circle", color: "pink" },
            ]
        it "should handle 'insert' meta-operations" $ do
            resolveMetaHistory([
                { id: "c", metaLevel: 0, type: "circle", name: "Draw Circle", color: "pink" },
                { id: "t", metaLevel: 0, type: "triangle", name: "Draw Triangle", color: "red" },
                { id: "i", metaLevel: 1, type: "insert", name: "Insert Draw Line", insertIndex: 1, insertOp: { id: "l", metaLevel: 0, type: "line", name: "Draw Line", color: "blue" } },
            ]) `shouldBe` [
                { id: "c", metaLevel: 0, type: "circle", name: "Draw Circle", color: "pink" },
                { id: "l", metaLevel: 0, type: "line", name: "Draw Line", color: "blue" },
                { id: "t", metaLevel: 0, type: "triangle", name: "Draw Triangle", color: "red" },
            ]
        it "should throw error if meta operation targets itself" $ do
            evaluate (resolveMetaHistory([
                { id: "so-meta", metaLevel: 1, type: "undo", name: "Undo Self!?", target: "so-meta" },
            ])) `shouldThrow` errorCall "target operation 'so-meta' has equal meta level to the meta operation"
        it "should throw error if target operation has higher meta level to meta operation" $ do
            evaluate (resolveMetaHistory([
                { id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue" },
                { id: "abc2", metaLevel: 1, type: "undo", name: "Undo Undo Undo Edit Draw Line", target: "abc4" }, // incorrect metaLevel
                { id: "abc3", metaLevel: 1, type: "undo", name: "Undo Edit Draw Line", target: "abc2" },
                { id: "abc4", metaLevel: 2, type: "undo", name: "Undo Undo Edit Draw Line", target: "abc3" }, // AKA Redo
            ])) `shouldThrow` errorCall "target operation 'abc4' was already applied and thus can't be affected"
        it "should throw error if target operation has equal meta level to meta operation" $ do
            evaluate (resolveMetaHistory([
                { id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue" },
                { id: "abc2", metaLevel: 1, type: "undo", name: "Undo Edit Draw Line", target: "abc1" },
                { id: "abc3", metaLevel: 2, type: "undo", name: "Undo Undo Edit Draw Line", target: "abc2" }, // AKA Redo
                { id: "abc4", metaLevel: 2, type: "undo", name: "Undo Undo Undo Edit Draw Line?", target: "abc3" }, // incorrect metaLevel
            ])) `shouldThrow` errorCall "target operation 'abc3' was already applied and thus can't be affected."
        it "should throw error if target operation has equal meta level to meta operation, with target after meta" $ do
            evaluate (resolveMetaHistory([
                { id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue" },
                { id: "abc2", metaLevel: 1, type: "undo", name: "Undo Edit Draw Line", target: "abc1" },
                { id: "abc4", metaLevel: 2, type: "undo", name: "Undo Undo Undo Edit Draw Line?", target: "abc3" }, // incorrect metaLevel
                { id: "abc3", metaLevel: 2, type: "undo", name: "Undo Undo Edit Draw Line", target: "abc2" }, // AKA Redo
            ])) `shouldThrow` errorCall "target operation 'abc3' has equal meta level to the meta operation"
        it "should throw error if target operation not found" $ do
            evaluate (resolveMetaHistory([
                { id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue" },
                { id: "abc3", metaLevel: 2, type: "undo", name: "Undo Edit Draw Line", target: "abc2" },
            ])) `shouldThrow` errorCall "target operation 'abc2' not found"
