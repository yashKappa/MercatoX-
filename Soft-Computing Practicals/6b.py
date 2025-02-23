from __future__ import division
import numpy as np
from neupy.utils import format_data
from neupy.core.properties import ProperFractionProperty, IntProperty
from neupy.algorithms.base import BaseNetwork

__all__ = ('ART1',)


class ART1(BaseNetwork):
    rho = ProperFractionProperty(default=0.5)
    n_clusters = IntProperty(default=2, minval=2)

    def train(self, X):
        X = format_data(X)
        if X.ndim != 2:
            raise ValueError("Input value must be 2 dimensional, got {}".format(X.ndim))
        
        nsamples, n_features = X.shape
        n_clusters = self.n_clusters
        step = self.step
        rho = self.rho
        
        if np.any((X != 0) & (X != 1)):
            raise ValueError("ART1 Network works only with binary matrices")
        
        if not hasattr(self, 'weight_21'):
            self.weight_21 = np.ones((n_features, n_clusters))
        if not hasattr(self, 'weight_12'):
            scaler = step / (step + n_clusters - 1)
            self.weight_12 = scaler * self.weight_21.T
        
        weight_21 = self.weight_21
        weight_12 = self.weight_12
        
        if n_features != weight_21.shape[0]:
            raise ValueError("Input data has invalid number of features. Got {} instead of {}".format(
                n_features, weight_21.shape[0]))
        
        classes = np.zeros(nsamples)
        for i, p in enumerate(X):
            disabled_neurons = []
            reseted_values = []
            reset = True
            
            while reset:
                output1 = p
                input2 = np.dot(weight_12, output1.T)
                output2 = np.zeros(input2.size)
                input2[disabled_neurons] = -np.inf
                winner_index = input2.argmax()
                output2[winner_index] = 1
                expectation = np.dot(weight_21, output2)
                output1 = np.logical_and(p, expectation).astype(int)
                reset_value = np.dot(output1.T, output1) / np.dot(p.T, p)
                reset = reset_value < rho
                
                if reset:
                    disabled_neurons.append(winner_index)
                    reseted_values.append((reset_value, winner_index))
                
                if len(disabled_neurons) >= n_clusters:
                    reset = False
                    winner_index = None
            
            if not reset:
                if winner_index is not None:
                    weight_12[winner_index, :] = (step * output1) / (
                        step + np.dot(output1.T, output1) - 1
                    )
                    weight_21[:, winner_index] = output1
                else:
                    winner_index = max(reseted_values)[1]
            
            classes[i] = winner_index
        
        return classes

    def predict(self, X):
        return self.train(X)
